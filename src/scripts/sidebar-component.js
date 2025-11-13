class Sidebar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        // Adiciona os event listeners depois que o componente é renderizado
        this.addEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                ${this.getStyles()}
            </style>
            ${this.getTemplate()}
        `;
    }

    getStyles() {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css');

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Poppins', sans-serif;
            }

            :host {
                display: block;
            }

            #sidebar {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background-color: #ffffff;
                height: 100vh;
                border-radius: 0px 18px 18px 0px;
                position: relative;
                transition: all .5s;
                min-width: 60px;
                z-index: 2;
            }

            #sidebar_content {
                padding: 12px;
            }

            #user {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 24px;
            }

            #user_avatar {
                width: 50px;
                height: 50px;
                object-fit: cover;
                border-radius: 8px;
            }

            #user_infos {
                display: flex;
                flex-direction: column;
            }

            #user_infos span:last-child {
                color: #6b6b6b;
                font-size: 12px;
            }

            #side_items {
                display: flex;
                flex-direction: column;
                gap: 8px;
                list-style: none;
            }

            .side-item {
                border-radius: 8px;
                padding: 14px;
                cursor: pointer;
            }

            .side-item.active {
                background-color: #8b5cf6;
            }

            .side-item:hover:not(.active),
            #logout_btn:hover {
                background-color: #e3e9f7;
            }

            .side-item a {
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #0a0a0a;
            }

            .side-item.active a {
                color: #e3e9f7;
            }

            .side-item a i {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
            }

            #logout {
                border-top: 1px solid #e3e9f7;
                padding: 12px;
            }

            #logout_btn {
                border: none;
                padding: 12px;
                font-size: 14px;
                display: flex;
                gap: 20px;
                align-items: center;
                border-radius: 8px;
                text-align: start;
                cursor: pointer;
                background-color: transparent;
                width: 100%;
                justify-content: center;
            }

            #open_btn {
                position: absolute;
                top: 30px;
                right: -10px;
                background-color: #8b5cf6;
                color: #e3e9f7;
                border-radius: 100%;
                width: 20px;
                height: 20px;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }

            #open_btn_icon {
                transition: transform .3s ease;
            }

            .open-sidebar #open_btn_icon {
                transform: rotate(180deg);
            }

            .item-description {
                width: 0px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                font-size: 14px;
                transition: width .6s;
                height: 0px;
            }

            #sidebar.open-sidebar {
                min-width: 200px;
            }

            #sidebar.open-sidebar .item-description {
                width: 150px;
                height: auto;
            }

            #sidebar.open-sidebar .side-item a {
                justify-content: flex-start;
                gap: 14px;
            }

            #sidebar.open-sidebar #logout_btn {
                justify-content: flex-start;
            }
        `;
    }

    getTemplate() {
        return `
            <nav id="sidebar">
                <div id="sidebar_content">
                    <div id="user">
                        <img src="/assets/img/resized.png" id="user_avatar" alt="Avatar">
                        <div id="user_infos">
                            <span class="item-description">USETRACK</span>
                            <span class="item-description">Bem-Vindo!</span>
                        </div>
                    </div>

                    <ul id="side_items">
                        <li class="side-item active">
                            <a href="#">
                                <i class="fa-solid fa-house"></i>
                                <span class="item-description">Home</span>
                            </a>
                        </li>
                        <li class="side-item">
                            <a href="#">
                                <i class="fa-solid fa-user-group"></i>
                                <span class="item-description">Contatos</span>
                            </a>
                        </li>
                        <li class="side-item">
                            <a href="#">
                                <i class="fa-solid fa-check-double"></i>
                                <span class="item-description">Tarefas</span>
                            </a>
                        </li>
                        <li class="side-item">
                            <a href="#">
                                <i class="fa-solid fa-chart-line"></i>
                                <span class="item-description">Relatórios</span>
                            </a>
                        </li>
                        <li class="side-item">
                            <a href="#">
                                <i class="fa-solid fa-gear"></i>
                                <span class="item-description">Configurações</span>
                            </a>
                        </li>
                    </ul>

                    <button id="open_btn">
                        <i id="open_btn_icon" class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                
                <div id="logout">
                    <button id="logout_btn">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span class="item-description">Sair</span>
                    </button>
                </div>
            </nav>
        `;
    }

    addEventListeners() {
        // Adiciona o evento de toggle diretamente no componente
        this.shadowRoot.getElementById('open_btn').addEventListener('click', () => {
            this.shadowRoot.getElementById('sidebar').classList.toggle('open-sidebar');
        });

        // Adiciona eventos para os itens do menu
        this.shadowRoot.querySelectorAll('.side-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active de todos os itens
                this.shadowRoot.querySelectorAll('.side-item').forEach(i => i.classList.remove('active'));
                // Adiciona active no item clicado
                item.classList.add('active');
            });
        });

        // Evento para logout
        this.shadowRoot.getElementById('logout_btn').addEventListener('click', () => {
            console.log('Logout clicado');
            // Adicione sua lógica de logout aqui
        });
    }
}

customElements.define('side-bar', Sidebar);