const defaultUsers = [
    {
        name: "Administrator",
        username: "admin",
        email: "admin@cms.com",
        password: "admin123",
        role: "Admin"
    },
    {
        name: "Demo User",
        username: "user",
        email: "user@cms.com",
        password: "user123",
        role: "User"
    }
];

const defaultContent = [
    {
        id: 1,
        title: "Welcome to ContentFlow",
        category: "General",
        body: "Welcome to our Content Management System. This page demonstrates published website content.",
        template: "Classic Article",
        author: "admin",
        status: "Published",
        views: 120,
        created: new Date().toISOString()
    },
    {
        id: 2,
        title: "Getting Started with CMS",
        category: "Technology",
        body: "A CMS helps people create and manage website content without needing advanced technical knowledge.",
        template: "Modern Blog",
        author: "admin",
        status: "Published",
        views: 86,
        created: new Date().toISOString()
    },
    {
        id: 3,
        title: "My First Article",
        category: "Education",
        body: "This is an example user submission waiting for administrator approval.",
        template: "Simple Page",
        author: "user",
        status: "Pending",
        views: 0,
        created: new Date().toISOString()
    }
];

function getData(key, fallback) {
    const value = localStorage.getItem(key);

    if (value === null) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch (e) {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
    return getData("cms_users", defaultUsers);
}

function getContent() {
    return getData("cms_content", defaultContent);
}

function current() {
    return JSON.parse(
        sessionStorage.getItem("cms_current") || "null"
    );
}

let editingId = null;


/* =========================
   LOGIN / SIGNUP
========================= */

function showAuth(mode) {

    const login = mode === "login";

    document
        .getElementById("loginForm")
        .classList.toggle("hidden", !login);

    document
        .getElementById("signupForm")
        .classList.toggle("hidden", login);

    document
        .getElementById("loginTab")
        .classList.toggle("active", login);

    document
        .getElementById("signupTab")
        .classList.toggle("active", !login);
}


function login(e) {

    e.preventDefault();

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const user = getUsers().find(
        u =>
            u.username === username &&
            u.password === password
    );

    if (!user) {

        document.getElementById("loginError").textContent =
            "Invalid username or password.";

        return;
    }

    sessionStorage.setItem(
        "cms_current",
        JSON.stringify(user)
    );

    startApp();
}


function signup(e) {

    e.preventDefault();

    const name =
        document.getElementById("signupName").value.trim();

    const username =
        document.getElementById("signupUsername").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const users = getUsers();

    if (
        users.some(
            u =>
                u.username.toLowerCase() ===
                username.toLowerCase()
        )
    ) {

        document.getElementById("signupError").textContent =
            "Username already exists.";

        return;
    }

    const user = {
        name,
        username,
        email,
        password,
        role: "User"
    };

    users.push(user);

    saveData("cms_users", users);

    alert(
        "Account created successfully. You can now login."
    );

    document.getElementById("signupForm").reset();

    showAuth("login");

    document.getElementById("loginUsername").value =
        username;
}


function logout() {

    sessionStorage.removeItem("cms_current");

    document
        .getElementById("app")
        .classList.add("hidden");

    document
        .getElementById("authScreen")
        .classList.remove("hidden");
}


/* =========================
   APPLICATION
========================= */

function startApp() {

    const user = current();

    if (!user) return;

    document
        .getElementById("authScreen")
        .classList.add("hidden");

    document
        .getElementById("app")
        .classList.remove("hidden");

    document.getElementById("welcomeUser").textContent =
        `${user.name} • ${user.role}`;

    const isAdmin = user.role === "Admin";

    document.getElementById("adminUsersBtn").style.display =
        isAdmin ? "block" : "none";

    document.getElementById("adminApprovalBtn").style.display =
        isAdmin ? "block" : "none";

    document.getElementById("quickApproval").style.display =
        isAdmin ? "block" : "none";

    refreshAll();

    openSection("dashboard");
}


function openSection(id) {

    document
        .querySelectorAll(".page-section")
        .forEach(section =>
            section.classList.add("hidden")
        );

    const section = document.getElementById(id);

    if (section) {
        section.classList.remove("hidden");
    }

    refreshAll();
}


/* =========================
   CREATE / EDIT CONTENT
========================= */

function openCreateContent() {

    editingId = null;

    document.getElementById("editorTitle").textContent =
        "Create Content";

    document.getElementById("editTitle").value = "";

    document.getElementById("editCategory").value =
        "Technology";

    document.getElementById("editBody").value = "";

    document.getElementById("editTemplate").value =
        "Classic Article";

    document.getElementById("editorMessage").textContent =
        "";

    openSection("editor");
}


function editContent(id) {

    const item =
        getContent().find(c => c.id === id);

    if (!item) return;

    editingId = id;

    document.getElementById("editorTitle").textContent =
        "Edit Content";

    document.getElementById("editTitle").value =
        item.title;

    document.getElementById("editCategory").value =
        item.category;

    document.getElementById("editBody").value =
        item.body;

    document.getElementById("editTemplate").value =
        item.template;

    document.getElementById("editorMessage").textContent =
        "";

    openSection("editor");
}


function saveContent(mode) {

    const user = current();

    const title =
        document.getElementById("editTitle").value.trim();

    const category =
        document.getElementById("editCategory").value;

    const body =
        document.getElementById("editBody").value.trim();

    const template =
        document.getElementById("editTemplate").value;

    if (!title || !body) {

        document.getElementById("editorMessage").textContent =
            "Please enter title and content.";

        return;
    }

    const content = getContent();

    if (editingId) {

        const item =
            content.find(c => c.id === editingId);

        if (item) {

            item.title = title;
            item.category = category;
            item.body = body;
            item.template = template;

            if (
                mode === "submit" &&
                user.role !== "Admin"
            ) {
                item.status = "Pending";
            }
        }

    } else {

        content.push({

            id: Date.now(),

            title,

            category,

            body,

            template,

            author: user.username,

            status:
                mode === "draft"
                    ? "Draft"
                    : user.role === "Admin"
                        ? "Published"
                        : "Pending",

            views: 0,

            created: new Date().toISOString()
        });
    }

    saveData("cms_content", content);

    document.getElementById("editorMessage").textContent =
        mode === "draft"
            ? "Saved as draft."
            : "Content submitted successfully.";

    setTimeout(
        () => openSection("content"),
        500
    );
}


function deleteContent(id) {

    if (!confirm("Delete this content?"))
        return;

    const content =
        getContent().filter(c => c.id !== id);

    saveData("cms_content", content);

    refreshAll();
}


function togglePublish(id) {

    const user = current();

    if (user.role !== "Admin") {

        alert(
            "Only Admin can publish or unpublish content."
        );

        return;
    }

    const content = getContent();

    const item =
        content.find(c => c.id === id);

    if (item) {

        item.status =
            item.status === "Published"
                ? "Draft"
                : "Published";
    }

    saveData("cms_content", content);

    refreshAll();
}


/* =========================
   APPROVAL
========================= */

function approveContent(id, status) {

    const user = current();

    if (user.role !== "Admin") {

        alert(
            "Only Admin can approve submissions."
        );

        return;
    }

    const content = getContent();

    const item =
        content.find(c => c.id === id);

    if (item) {

        item.status = status;
    }

    saveData("cms_content", content);

    const message =
        document.getElementById("approvalMessage");

    if (message) {

        message.innerHTML = `

            <div class="approval-success">

                ${
                    status === "Published"
                        ? "✓ Content approved and published successfully."
                        : "✓ Content rejected successfully."
                }

            </div>

        `;
    }

    refreshAll();

    document
        .querySelectorAll(".page-section")
        .forEach(section =>
            section.classList.add("hidden")
        );

    document
        .getElementById("approval")
        .classList.remove("hidden");
}


/* =========================
   FULL ARTICLE VIEWER
========================= */

function showArticle(id) {

    const content = getContent();

    const item =
        content.find(c => c.id === id);

    if (!item) return;


    /* Increase article views */

    item.views =
        Number(item.views || 0) + 1;

    saveData("cms_content", content);


    /* Find or create modal */

    let modal =
        document.getElementById("articleModal");


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id = "articleModal";

        modal.className = "article-modal";

        document.body.appendChild(modal);
    }


    /* Convert text safely */

    const formattedBody =
        escapeHtml(item.body)
            .replace(/\n/g, "<br>");


    /* Create article popup */

    modal.innerHTML = `

        <div
            class="article-modal-backdrop"
            onclick="closeArticle()">
        </div>


        <div
            class="article-modal-card"
            role="dialog"
            aria-modal="true">


            <button
                class="article-close"
                onclick="closeArticle()">

                &times;

            </button>


            <div class="article-modal-category">

                ${escapeHtml(item.category)}

                &nbsp; • &nbsp;

                ${escapeHtml(item.template)}

            </div>


            <h1>

                ${escapeHtml(item.title)}

            </h1>


            <div class="article-modal-meta">

                By ${escapeHtml(item.author)}

                &nbsp; • &nbsp;

                ${item.views} views

            </div>


            <div class="article-modal-body">

                ${formattedBody}

            </div>


        </div>
    `;


    modal.classList.add("show");

    document.body.classList.add(
        "article-modal-open"
    );


    document.addEventListener(
        "keydown",
        articleEscapeHandler
    );


    refreshAll();
}


function closeArticle() {

    const modal =
        document.getElementById("articleModal");

    if (modal) {

        modal.classList.remove("show");
    }

    document.body.classList.remove(
        "article-modal-open"
    );

    document.removeEventListener(
        "keydown",
        articleEscapeHandler
    );
}


function articleEscapeHandler(e) {

    if (e.key === "Escape") {

        closeArticle();
    }
}


/* =========================
   ARTICLE VIEWER CSS
========================= */

function addArticleViewerStyles() {

    if (
        document.getElementById(
            "articleViewerStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "articleViewerStyles";


    style.textContent = `

        body.article-modal-open {

            overflow: hidden;

        }


        .article-modal {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 24px;

        }


        .article-modal.show {

            display: flex;

        }


        .article-modal-backdrop {

            position: absolute;

            inset: 0;

            background: rgba(
                15,
                23,
                42,
                0.65
            );

            backdrop-filter: blur(3px);

        }


        .article-modal-card {

            position: relative;

            z-index: 1;

            width: min(
                900px,
                95vw
            );

            max-height: 88vh;

            overflow-y: auto;

            background: white;

            border-radius: 14px;

            padding: 32px 36px;

            box-shadow:
                0 25px 70px
                rgba(0,0,0,.25);

        }


        .article-close {

            position: absolute;

            top: 14px;

            right: 16px;

            width: 38px;

            height: 38px;

            border: 0;

            border-radius: 50%;

            background: #f1f5f9;

            color: #334155;

            font-size: 27px;

            line-height: 1;

            cursor: pointer;

        }


        .article-close:hover {

            background: #e2e8f0;

        }


        .article-modal-category {

            color: #2563eb;

            font-size: 14px;

            font-weight: 600;

            margin-bottom: 10px;

        }


        .article-modal-card h1 {

            margin:
                0
                45px
                8px
                0;

            color: #0f172a;

            font-size: 30px;

            line-height: 1.25;

        }


        .article-modal-meta {

            color: #64748b;

            font-size: 14px;

            margin-bottom: 24px;

            padding-bottom: 18px;

            border-bottom:
                1px solid #e2e8f0;

        }


        .article-modal-body {

            color: #1e293b;

            font-size: 17px;

            line-height: 1.8;

            word-wrap: break-word;

        }


        .article-title-link {

            border: 0;

            background: transparent;

            padding: 0;

            margin: 0;

            color: #0f172a;

            font: inherit;

            font-weight: 700;

            font-size: 19px;

            text-align: left;

            cursor: pointer;

        }


        .article-title-link:hover {

            color: #2563eb;

        }


        .read-article-btn {

            margin-top: 8px;

            border:
                1px solid #cbd5e1;

            background: white;

            color: #2563eb;

            padding: 7px 12px;

            border-radius: 6px;

            cursor: pointer;

        }


        .read-article-btn:hover {

            background: #eff6ff;

        }


        .approval-success {

            background: #dcfce7;

            color: #166534;

            border:
                1px solid #86efac;

            padding: 12px 15px;

            border-radius: 8px;

            margin-bottom: 15px;

            font-weight: 600;

        }


        @media (max-width: 600px) {

            .article-modal {

                padding: 10px;

            }


            .article-modal-card {

                padding:
                    25px
                    20px;

                max-height: 92vh;

            }


            .article-modal-card h1 {

                font-size: 24px;

            }


            .article-modal-body {

                font-size: 16px;

            }

        }

    `;


    document.head.appendChild(style);
}


/* =========================
   CONTENT LIST
========================= */

function renderContent() {

    const user = current();

    const all = getContent();

    const filter =
        document.getElementById(
            "contentFilter"
        ).value;

    const query =
        document.getElementById(
            "contentSearch"
        ).value.toLowerCase();


    let list =
        all.filter(
            c =>
                c.title
                    .toLowerCase()
                    .includes(query) ||

                c.category
                    .toLowerCase()
                    .includes(query) ||

                c.body
                    .toLowerCase()
                    .includes(query)
        );


    if (user.role !== "Admin") {

        list =
            list.filter(
                c =>
                    c.author === user.username
            );
    }


    if (filter !== "all") {

        list =
            list.filter(
                c =>
                    c.status.toLowerCase() ===
                    filter
            );
    }


    const box =
        document.getElementById(
            "contentList"
        );


    if (!list.length) {

        box.innerHTML = `

            <div class="panel">

                <p>
                    No content found.
                </p>

            </div>

        `;

        return;
    }


    box.innerHTML = list.map(c => {

        const canEdit =
            user.role === "Admin" ||
            c.author === user.username;


        return `

            <div class="content-item">


                <button
                    class="article-title-link"
                    onclick="showArticle(${c.id})"
                    title="Read full article">

                    ${escapeHtml(c.title)}

                </button>


                <div class="meta">

                    <span
                        class="badge ${c.status.toLowerCase()}">

                        ${c.status}

                    </span>

                    <span>
                        ${escapeHtml(c.category)}
                    </span>

                    <span>•</span>

                    <span>
                        By ${escapeHtml(c.author)}
                    </span>

                    <span>•</span>

                    <span>
                        ${c.views} views
                    </span>

                </div>


                <p>

                    ${escapeHtml(
                        c.body.substring(
                            0,
                            180
                        )
                    )}

                    ${
                        c.body.length > 180
                            ? "..."
                            : ""
                    }

                </p>


                <button
                    class="read-article-btn"
                    onclick="showArticle(${c.id})">

                    Read Full Article

                </button>


                <div class="actions">


                    ${
                        canEdit
                            ? `
                                <button
                                    onclick="editContent(${c.id})">

                                    Edit

                                </button>
                            `
                            : ""
                    }


                    ${
                        user.role === "Admin"
                            ? `

                                <button
                                    onclick="togglePublish(${c.id})">

                                    ${
                                        c.status ===
                                        "Published"
                                            ? "Unpublish"
                                            : "Publish"
                                    }

                                </button>

                            `
                            : ""
                    }


                    ${
                        canEdit
                            ? `

                                <button
                                    class="danger"
                                    onclick="deleteContent(${c.id})">

                                    Delete

                                </button>

                            `
                            : ""
                    }


                </div>

            </div>

        `;

    }).join("");
}


/* =========================
   RECENT CONTENT
========================= */

function renderRecent() {

    const all =
        getContent()
            .slice()
            .sort(
                (a, b) =>
                    b.id - a.id
            )
            .slice(0, 4);


    document.getElementById(
        "recentContent"
    ).innerHTML = all.map(
        c => `

            <div class="content-item">

                <button
                    class="article-title-link"
                    onclick="showArticle(${c.id})">

                    ${escapeHtml(c.title)}

                </button>


                <div class="meta">

                    <span
                        class="badge ${c.status.toLowerCase()}">

                        ${c.status}

                    </span>

                    <span>
                        ${escapeHtml(c.category)}
                    </span>

                </div>

            </div>

        `
    ).join("");
}


/* =========================
   APPROVAL
========================= */

function renderApproval() {

    const pending =
        getContent().filter(
            c =>
                c.status === "Pending"
        );


    const box =
        document.getElementById(
            "approvalList"
        );


    if (!pending.length) {

        box.innerHTML = `

            <div class="panel">

                <p>
                    No pending submissions.
                    Everything is up to date.
                </p>

            </div>

        `;

        return;
    }


    box.innerHTML =
        pending.map(
            c => `

                <div class="content-item">

                    <h3>
                        ${escapeHtml(c.title)}
                    </h3>


                    <div class="meta">

                        <span>
                            ${escapeHtml(c.category)}
                        </span>

                        <span>
                            Submitted by
                            ${escapeHtml(c.author)}
                        </span>

                    </div>


                    <p>

                        ${escapeHtml(c.body)}

                    </p>


                    <div class="actions">


                        <button
                            class="primary"
                            onclick="approveContent(
                                ${c.id},
                                'Published'
                            )">

                            Approve & Publish

                        </button>


                        <button
                            class="danger"
                            onclick="approveContent(
                                ${c.id},
                                'Rejected'
                            )">

                            Reject

                        </button>


                    </div>

                </div>

            `
        ).join("");
}


/* =========================
   USERS
========================= */

function renderUsers() {

    const users =
        getUsers();


    document.getElementById(
        "userTable"
    ).innerHTML =
        users.map(
            u => `

                <tr>

                    <td>
                        ${escapeHtml(u.name)}
                    </td>

                    <td>
                        ${escapeHtml(u.username)}
                    </td>

                    <td>
                        ${escapeHtml(u.email)}
                    </td>

                    <td>

                        <span
                            class="role role-${u.role.toLowerCase()}">

                            ${u.role}

                        </span>

                    </td>

                    <td>
                        Active
                    </td>

                </tr>

            `
        ).join("");
}


/* =========================
   SEARCH
========================= */

function renderSearch() {

    const query =
        document.getElementById(
            "globalSearch"
        ).value.toLowerCase();


    const results =
        getContent().filter(
            c =>
                c.status === "Published" &&
                (
                    c.title
                        .toLowerCase()
                        .includes(query) ||

                    c.category
                        .toLowerCase()
                        .includes(query) ||

                    c.body
                        .toLowerCase()
                        .includes(query)
                )
        );


    document.getElementById(
        "searchResults"
    ).innerHTML =

        results.length

            ? results.map(
                c => `

                    <div class="content-item">

                        <button
                            class="article-title-link"
                            onclick="showArticle(${c.id})">

                            ${escapeHtml(c.title)}

                        </button>


                        <div class="meta">

                            <span>
                                ${escapeHtml(c.category)}
                            </span>

                            <span>
                                By ${escapeHtml(c.author)}
                            </span>

                            <span>
                                ${c.views} views
                            </span>

                        </div>


                        <p>

                            ${escapeHtml(
                                c.body.substring(
                                    0,
                                    180
                                )
                            )}

                            ${
                                c.body.length > 180
                                    ? "..."
                                    : ""
                            }

                        </p>


                        <button
                            class="read-article-btn"
                            onclick="showArticle(${c.id})">

                            Read Full Article

                        </button>

                    </div>

                `
            ).join("")

            : `

                <div class="panel">

                    <p>
                        No published content
                        matches your search.
                    </p>

                </div>

            `;
}


/* =========================
   ANALYTICS
========================= */

function renderAnalytics() {

    const c = getContent();


    document.getElementById(
        "analyticsViews"
    ).textContent =
        c.reduce(
            (sum, x) =>
                sum + Number(x.views || 0),
            0
        );


    document.getElementById(
        "analyticsCreated"
    ).textContent =
        c.length;


    document.getElementById(
        "analyticsPublished"
    ).textContent =
        c.filter(
            x =>
                x.status === "Published"
        ).length;


    document.getElementById(
        "analyticsRejected"
    ).textContent =
        c.filter(
            x =>
                x.status === "Rejected"
        ).length;


    const total =
        Math.max(c.length, 1);


    const statuses = [

        [
            "Published",
            c.filter(
                x =>
                    x.status ===
                    "Published"
            ).length
        ],

        [
            "Draft",
            c.filter(
                x =>
                    x.status ===
                    "Draft"
            ).length
        ],

        [
            "Pending",
            c.filter(
                x =>
                    x.status ===
                    "Pending"
            ).length
        ],

        [
            "Rejected",
            c.filter(
                x =>
                    x.status ===
                    "Rejected"
            ).length
        ]

    ];


    document.getElementById(
        "analyticsBars"
    ).innerHTML =

        statuses.map(
            ([name, n]) => `

                <div class="bar-row">

                    <div class="bar-label">

                        <span>
                            ${name}
                        </span>

                        <b>
                            ${n}
                        </b>

                    </div>


                    <div class="bar">

                        <span
                            style="
                                width:
                                ${Math.max(
                                    n / total * 100,
                                    n ? 5 : 0
                                )}%
                            ">
                        </span>

                    </div>

                </div>

            `
        ).join("");
}


/* =========================
   PROFILE
========================= */

function renderProfile() {

    const u = current();


    document.getElementById(
        "profileCard"
    ).innerHTML = `

        <div class="profile-row">

            <b>Name</b>

            <span>
                ${escapeHtml(u.name)}
            </span>

        </div>


        <div class="profile-row">

            <b>Username</b>

            <span>
                ${escapeHtml(u.username)}
            </span>

        </div>


        <div class="profile-row">

            <b>Email</b>

            <span>
                ${escapeHtml(u.email)}
            </span>

        </div>


        <div class="profile-row">

            <b>Role</b>

            <span>
                ${u.role}
            </span>

        </div>

    `;
}


/* =========================
   REFRESH
========================= */

function refreshAll() {

    if (!current()) return;


    const c = getContent();


    document.getElementById(
        "statTotal"
    ).textContent =
        c.length;


    document.getElementById(
        "statPublished"
    ).textContent =
        c.filter(
            x =>
                x.status ===
                "Published"
        ).length;


    document.getElementById(
        "statPending"
    ).textContent =
        c.filter(
            x =>
                x.status ===
                "Pending"
        ).length;


    document.getElementById(
        "statUsers"
    ).textContent =
        getUsers().length;


    renderRecent();

    renderContent();

    renderApproval();

    renderUsers();

    renderAnalytics();

    renderProfile();
}


/* =========================
   TEMPLATES
========================= */

function useTemplate(template) {

    openCreateContent();

    document.getElementById(
        "editTemplate"
    ).value =
        template;
}


/* =========================
   SECURITY
========================= */

function escapeHtml(text) {

    return String(text).replace(
        /[&<>"']/g,

        m => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        }[m])
    );
}


/* =========================
   PAGE LOAD
========================= */

window.addEventListener(
    "load",
    () => {

        addArticleViewerStyles();

        getUsers();

        getContent();

        if (current()) {

            startApp();

        }

    }
);
