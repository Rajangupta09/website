class localStorage {
    constructor() {
        if (typeof(Storage) === "undefined") {
            this.state = false;
        } else {
            this.state = true;
        }
    }

    getState() {
        return this.state;
    }

    setKey(key, data) {
        if (this.getState()) {
            window.localStorage.setItem(key, data);
        }
    }

    getKey(key) {
        if (this.getState()) {
            return window.localStorage.getItem(key);
        }
    }

    removeKey(key) {
        if (this.getState()) {
            window.localStorage.removeItem(key);
        }
    }

    clearAll() {
        window.localStorage.clear();
    }
}

let ls = new localStorage();

$(document).ready(function(){
    $(".sidenav").sidenav();
    $(".tabs").tabs();
    $(".collapsible").collapsible();
    $(".tooltipped").tooltip();

    fetchRepos();
    fetchTeam();
    init();
});

function fetchRepos(force = false) {
    fetch("https://api.github.com/orgs/devCANS/repos", {
        headers: {
            "Accept": "application/vnd.github.v3+json",
            "If-None-Match": ls.getKey("repo-etag")
        }
    }).then(
        function(response) {
            if (response.status == 304) {
                try {
                    let data = JSON.parse(ls.getKey("repo-data"));
                    updateRepos(data);
                    console.log("[LOCAL Repo] Loaded cached copy.");
                } catch (e) {
                    ls.removeKey("repo-etag");
                    setTimeout(fetchRepos());
                }
                return;
            }
            if (response.status !== 200) {
                console.log("[FETCH Repo] Request failed!. Status Code: " + response.status);
                return;
            }

            response.json().then(function(data) {
                try {
                    ls.setKey("repo-etag", response.headers.get("etag"));
                    ls.setKey("repo-data", JSON.stringify(data));
                } catch (e) {
                    console.log("[FETCH Repo] ETag Missing");
                }

                updateRepos(data);
            });
        }
    ).catch(function(err) {
        console.log("[FETCH Repo] Fetch Error!", err);
    });
}

function updateRepos(data){
    const repoContainer = document.querySelector(".repo-container");
    data.forEach((val) => {
        // Creating Repo card
        let repoItem = createElement("div", {class: "col-md-6 col-lg-4 repo-item"});
        let box = createElement("div", {class: "box"});
        let icon = createElement("div", {class: "icon"});
        
        // Fetching image for repository
        let iconImg = val.name.split("-")[0].toLowerCase();
        let imgSource = "";

        if (iconImg === "website") {
            // For devcans website repo
            imgSource = "assets/img/icon.png"
        } else {
            if (iconImg === "web") {
                iconImg = "html";
            }
            imgSource = `https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/${iconImg}/${iconImg}.png`;
        }
        icon.appendChild(createElement("img", {src: imgSource, class: "icon", style: "background: #FCEEF3;"}));
        box.appendChild(icon);
        let h3 = createElement("h3", {class: "title"});
        h3.innerHTML = `
            <a href="${val.html_url}" target="_">${val.name.replaceAll("-", " ").toUpperCase()}</a>
        `;
        box.appendChild(h3);
        let p = createElement("p", {class: "description"});
        p.innerHTML = val.description;
        box.appendChild(p);
        repoItem.appendChild(box);
        repoContainer.appendChild(repoItem);
    });

    // Setting up listener for show more button
    const button = document.querySelector(".more-btn");
    button.addEventListener("click", () => {
        button.childNodes[1].classList.toggle("more-btn-inactive");
        let text = button.childNodes[3].textContent;

        text == "Show More" ? text = "Show Less" : text = "Show More";
        
        button.childNodes[3].textContent = text;
        button.childNodes[5].classList.toggle("more-btn-inactive");

        if (button.childNodes[1].classList.contains("more-btn-inactive")) {
            repoContainer.style.maxHeight = 350 + "px";
        } else {
            repoContainer.style.maxHeight = repoContainer.scrollHeight + "px";
        }
    });
}

function fetchTeam(force = false) {
    fetch("./assets/js/members.json")
    .then(
        function(response) {
            if (response.status !== 200) {
                console.log("[FETCH Team] Request failed!. Status Code: " + response.status);
                return;
            }
            response.json().then(function(data) {
                updateTeam(data);
            });
            }
            ).catch(function(err) {
                console.log("[FETCH Team] Fetch Error!", err);
    });
}

function updateTeam(data){
    Object.entries(data).forEach((val) => {
            val[1].forEach((key)=> {
                setMember(key);   
            })
        })
    }


function setMember(info){
    let teamContainer = document.querySelector('#'+info.profile+'-container');
    let outerDiv = createElement("div", {class: info.profile+"-container"});
    let basicdetails = createElement("div", {class: "basic-details"});
    let img = createElement("img",{class: info.profile+"-image", src: info.img});
    let h3 = createElement("h3", {class: info.profile+"-name"});
    let h4 = createElement("h4", {class: info.profile+"-designation "+info.profile+"-name ml-2"});
    let innerdetails = createElement("div", {class: "outer-circle"});
    h3.innerHTML = info.name;
    h4.innerHTML = info.designation;
    basicdetails.appendChild(img);
    basicdetails.appendChild(h3);
    basicdetails.appendChild(h4);
    outerDiv.appendChild(basicdetails);
    outerDiv.appendChild(innerdetails);
    teamContainer.appendChild(outerDiv);
    };

function createElement(tag, options = {}, html = "") {
    let e = document.createElement(tag);
    
    for (const attr in options) {
        $(e).attr(attr, options[attr]);
    }

    if (html != "") {
        $(e).html(html);
    }
    return e;
}




function getMaterialIcon(icon, addClasses = "", DOMElement = true) {
    if (DOMElement) {
        return createElement("i", {class: "material-icons " + addClasses}, icon);
    }
    return "<i class='material-icons " + addClasses + "'>" + icon + "</i>";
}

function formatDate(data) {
    if (Number(data) < 10) {
        return "0" + data;
    }
    return data;
}

class TypeWriter {
    constructor(textElement, words, wait = 3000) {
        this.textElement = textElement;
        this.words = words;
        this.text = "";
        this.wordIndex = 0;
        this.wait = parseInt(wait, 10);
        this.isDeleting = false;
        this.type();
    }

    // Type method
    type() {
        // current index of word
        const current = this.wordIndex % this.words.length;
        // Get full text of current word
        const fullText = this.words[current];

        // Check if deleting
        if (this.isDeleting) {
            // Remove char
            this.text = fullText.substring(0, this.text.length - 1);
        } else {
            // Add char
            this.text = fullText.substring(0, this.text.length + 1);
        }

        // Insert text into element
        this.textElement.innerHTML = this.text;

        // Initial type Speed
        let typeSpeed = 250;

        if (this.isDeleting) {
            typeSpeed /= 2;
        }

        // If word is complete
        if (!this.isDeleting && this.text === fullText) {
            // Make pause at end
            typeSpeed = this.wait;
            // Set delete to true
            this.isDeleting = true;
        } else if (this.isDeleting && this.text === "") {
            this.isDeleting = false;
            //
            this.wordIndex++;
            // Pause before start typing
            typeSpeed = 500;
        }
        setTimeout(() => this.type(), typeSpeed);
    }
}

function init() {
    const textElement = document.querySelector(".txt-type");
    const words = JSON.parse(textElement.getAttribute("data-words"));
    const wait = textElement.getAttribute("data-wait");
    // init TypeWriter

    new TypeWriter(textElement, words, wait);
}






