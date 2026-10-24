document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("loginOverlay");
    const modal = document.querySelector(".login-modal");
    const modalTitle = document.getElementById("modalTituloAuth");
    const modalSubtitle = document.getElementById("modalSubtituloAuth");
    const closeBtn = document.getElementById("cerrarLogin");
    const forms = document.querySelectorAll(".auth-form");
    const msg = document.getElementById("authMessage");

    const usuarios = () => JSON.parse(localStorage.getItem("usuariosFerreteria") || "[]");
    const guardarUsuarios = lista => localStorage.setItem("usuariosFerreteria", JSON.stringify(lista));
    const usuarioActual = () => JSON.parse(localStorage.getItem("usuarioActivoFerreteria") || "null");

    function actualizarHeader() {
        const u = usuarioActual();
        const loginBtns = document.querySelectorAll("#btnLoginHeader, .btn-login-header");
        const userBoxes = document.querySelectorAll("#loginUserBox, .loginUserBox");
        const menus = document.querySelectorAll("#menuUsuario, .menu-usuario");

        if (u) {
            loginBtns.forEach(btn => {
                btn.style.setProperty("display", "none", "important");
                btn.setAttribute("aria-hidden", "true");
            });

            userBoxes.forEach(box => {
                box.style.setProperty("display", "inline-block", "important");
                box.removeAttribute("aria-hidden");
            });

            document.querySelectorAll("#usuarioNombreTexto, .usuarioNombreTexto").forEach(el => {
                el.innerHTML = '<img src="img/usuario-profesional.svg" alt="Usuario"> Bienvenido, ' + u.nombre;
            });

            document.querySelectorAll(".usuarioNombreCompleto").forEach(el => {
                el.textContent = (u.nombre + " " + (u.apellido || "")).trim();
            });

            document.querySelectorAll(".usuarioCorreoCard").forEach(el => {
                el.textContent = u.correo || "";
            });
        } else {
            loginBtns.forEach(btn => {
                btn.style.setProperty("display", "inline-flex", "important");
                btn.removeAttribute("aria-hidden");
            });

            userBoxes.forEach(box => {
                box.style.setProperty("display", "none", "important");
                box.setAttribute("aria-hidden", "true");
            });

            menus.forEach(menu => {
                menu.style.setProperty("display", "none", "important");
            });
        }
    }

    function mostrarMensaje(texto, error = false) {
        if (!msg) return;
        msg.textContent = texto;
        msg.className = "auth-message" + (error ? " error" : "");
        msg.style.display = "block";
    }

    function limpiarMensaje() {
        if (!msg) return;
        msg.textContent = "";
        msg.style.display = "none";
        msg.className = "auth-message";
    }

    function mostrarFormulario(id) {
        limpiarMensaje();
        forms.forEach(f => f.classList.remove("active"));
        const form = document.getElementById(id);
        if (form) form.classList.add("active");

        if (modal) modal.classList.toggle("registro-activo", id === "formRegistro");

        if (modalTitle && modalSubtitle) {
            if (id === "formLogin") {
                modalTitle.textContent = "Bienvenido de nuevo";
                modalSubtitle.textContent = "Inicia sesión para continuar";
            } else if (id === "formRecuperar") {
                modalTitle.textContent = "Restablecer contraseña";
                modalSubtitle.textContent = "Ingresa tu nueva contraseña para recuperar tu acceso";
            } else {
                modalTitle.textContent = "Crea tu cuenta";
                modalSubtitle.textContent = "Completa tus datos para registrarte";
            }
        }
    }

    function abrirModal() {
        if (overlay) {
            overlay.classList.add("active");
            mostrarFormulario("formLogin");
        }
    }

    function cerrarModal() {
        if (overlay) overlay.classList.remove("active");
    }

    document.querySelectorAll("#btnLoginHeader, .btn-login-header").forEach(btn => {
        btn.addEventListener("click", abrirModal);
    });

    if (closeBtn) closeBtn.addEventListener("click", cerrarModal);

    if (overlay) {
        overlay.addEventListener("click", e => {
            if (e.target === overlay) cerrarModal();
        });
    }

    document.querySelectorAll("[data-auth-form]").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            mostrarFormulario(link.getAttribute("data-auth-form"));
        });
    });

    const formRegistro = document.getElementById("formRegistro");
    if (formRegistro) {
        formRegistro.addEventListener("submit", e => {
            e.preventDefault();

            const nombre = document.getElementById("regNombre").value.trim();
            const apellido = document.getElementById("regApellido").value.trim();
            const correo = document.getElementById("regCorreo").value.trim();
            const password = document.getElementById("regPassword").value.trim();
            const telefono = document.getElementById("regTelefono").value.trim();

            if (!nombre || !apellido || !correo || !password || !telefono) {
                mostrarMensaje("Completa todos los campos para registrarte.", true);
                return;
            }

            const lista = usuarios();
            const existente = lista.find(u => u.correo.toLowerCase() === correo.toLowerCase());

            if (existente) {
                mostrarMensaje("Este correo ya está registrado. Puedes iniciar sesión.", true);
                return;
            }

            lista.push({ nombre, apellido, correo, password, telefono });
            guardarUsuarios(lista);
            formRegistro.reset();

            mostrarMensaje("Te registraste satisfactoriamente, ya puedes iniciar sesión.");

            setTimeout(() => {
                mostrarFormulario("formLogin");
                const loginCorreo = document.getElementById("loginCorreo");
                if (loginCorreo) loginCorreo.value = correo;
            }, 1400);
        });
    }

    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
        formLogin.addEventListener("submit", e => {
            e.preventDefault();

            const correo = document.getElementById("loginCorreo").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            const encontrado = usuarios().find(u =>
                u.correo.toLowerCase() === correo.toLowerCase() && u.password === password
            );

            if (!encontrado) {
                mostrarMensaje("Correo o contraseña incorrectos.", true);
                return;
            }

            localStorage.setItem("usuarioActivoFerreteria", JSON.stringify(encontrado));
            mostrarMensaje("Inicio de sesión correcto. Bienvenido, " + encontrado.nombre + ".");
            actualizarHeader();

            setTimeout(cerrarModal, 1000);
        });
    }

    const formRecuperar = document.getElementById("formRecuperar");
    if (formRecuperar) {
        formRecuperar.addEventListener("submit", e => {
            e.preventDefault();

            const correo = document.getElementById("recCorreo").value.trim();
            const nuevaPassword = document.getElementById("recPassword").value.trim();
            const lista = usuarios();
            const usuario = lista.find(u => u.correo.toLowerCase() === correo.toLowerCase());

            if (!usuario) {
                mostrarMensaje("No encontramos una cuenta con ese correo.", true);
                return;
            }

            usuario.password = nuevaPassword;
            guardarUsuarios(lista);
            formRecuperar.reset();

            mostrarMensaje("Se restableció tu contraseña.");

            setTimeout(() => {
                mostrarFormulario("formLogin");
                const loginCorreo = document.getElementById("loginCorreo");
                if (loginCorreo) loginCorreo.value = correo;
            }, 1400);
        });
    }

    document.querySelectorAll("#loginUserBox, .loginUserBox").forEach(box => {
        box.addEventListener("click", e => {
            e.stopPropagation();
            const menu = box.querySelector("#menuUsuario, .menu-usuario");
            if (menu) {
                menu.style.setProperty(
                    "display",
                    menu.style.display === "block" ? "none" : "block",
                    "important"
                );
            }
        });
    });

    document.querySelectorAll("#menuUsuario, .menu-usuario").forEach(menu => {
        menu.addEventListener("click", e => e.stopPropagation());
    });

    document.addEventListener("click", () => {
        document.querySelectorAll("#menuUsuario, .menu-usuario").forEach(menu => {
            menu.style.setProperty("display", "none", "important");
        });
    });

    document.querySelectorAll("#btnCerrarSesion, .btn-cerrar-sesion-card").forEach(btn => {
        btn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            localStorage.removeItem("usuarioActivoFerreteria");
            document.querySelectorAll("#menuUsuario, .menu-usuario").forEach(menu => {
                menu.style.setProperty("display", "none", "important");
            });
            actualizarHeader();
        });
    });

    actualizarHeader();
});
