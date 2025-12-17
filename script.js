let cart = [];
const CURRENCY_SYMBOL = 'S/';

const cartTotalItemsSpan = document.getElementById('total-articulos');
const cartGrandTotalSpan = document.getElementById('total-precio');
const cartItemsListDiv = document.getElementById('lista-carrito');
const checkoutButton = document.getElementById('boton-pagar');
const logPanel = document.getElementById('registro');

const productGrids = [
    document.getElementById('cpu-lista'),
    document.getElementById('gpu-lista'),
    document.getElementById('almacenamiento-lista'),
    document.getElementById('energia-lista'),
    document.getElementById('perifericos-lista'),
    document.getElementById('software-lista')
];


function updateStock(id, change) {
    const card = document.querySelector(`.tarjeta[data-id="${id}"]`);
    if (!card) return false;

    let stock = parseInt(card.getAttribute('data-stock')) + change;
    if (stock < 0) return false;

    card.setAttribute('data-stock', stock);
    checkStockAndDisableButtons();
    return true;
}

function checkStockAndDisableButtons() {
    productGrids.forEach(grid => {
        if (!grid) return;

        grid.querySelectorAll('.tarjeta').forEach(card => {
            const stock = parseInt(card.getAttribute('data-stock'));
            const button = card.querySelector('.boton-comprar');
            const label = card.querySelector('.etiqueta');

            if (stock <= 0) {
                button.disabled = true;
                button.textContent = 'Agotado';
                button.classList.add('deshabilitado');
                label.textContent = 'Agotado';
                label.className = 'etiqueta critico';
            } else {
                button.disabled = false;
                button.textContent = 'Comprar';
                button.classList.remove('deshabilitado');

                if (stock <= 5) {
                    label.textContent = `Últimas ${stock} Unid.`;
                    label.className = 'etiqueta alerta';
                } else {
                    label.textContent = `En Stock (${stock})`;
                    label.className = 'etiqueta ok';
                }
            }
        });
    });
}


function addToCart(id, name, price) {
    if (!updateStock(id, -1)) {
       logInteraction(`Stock agotado: ${name}`);
        return;
    }

    const item = cart.find(p => p.id === id);
    if (item) {
        item.quantity++;
        item.subtotal = item.quantity * item.price;
    } else {
        cart.push({ id, name, price, quantity: 1, subtotal: price });
    }

    updateCartUI();
    logInteraction(`"${name}" añadido al carrito`);
}

function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index === -1) return;

    const item = cart[index];
    updateStock(id, +1);

    if (item.quantity > 1) {
        item.quantity--;
        item.subtotal = item.quantity * item.price;
    } else {
        cart.splice(index, 1);
    }

    updateCartUI();
}


function renderCartItems() {
    cartItemsListDiv.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsListDiv.innerHTML = '<p class="relleno">El carrito está vacío.</p>';
        checkoutButton.disabled = true;
    } else {
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.subtotal;

            const div = document.createElement('div');
            div.className = 'articulo-carrito';
            div.innerHTML = `
                <span class="nombre-articulo">${item.name} (${item.quantity})</span>
                <span class="precio-articulo">${CURRENCY_SYMBOL}${item.subtotal.toFixed(2)}</span>
                <button class="boton-quitar" data-id="${item.id}">-1</button>
            `;
            cartItemsListDiv.appendChild(div);
        });
        checkoutButton.disabled = false;
    }

    cartTotalItemsSpan.textContent = totalItems;
    cartGrandTotalSpan.textContent = totalPrice.toFixed(2);
    saveCart();
}

function updateCartUI() {
    renderCartItems();
}

function logInteraction(msg) {
    logPanel.textContent = msg;
}


function attachProductListeners(grid) {
    if (!grid) return;

    grid.addEventListener('click', e => {
        const button = e.target.closest('.boton-comprar');
        if (!button || button.disabled) return;

        const card = button.closest('.tarjeta');
        addToCart(
            card.dataset.id,
            card.querySelector('.nombre').textContent,
            parseFloat(card.dataset.price)
        );

        button.classList.add('added');
        button.textContent = '¡AÑADIDO!';
        setTimeout(() => {
            if (parseInt(card.dataset.stock) > 0) {
                button.textContent = 'Comprar';
                button.classList.remove('added');
            }
        }, 700);
    });
}

productGrids.forEach(attachProductListeners);

cartItemsListDiv.addEventListener('click', e => {
    if (e.target.classList.contains('boton-quitar')) {
        removeFromCart(e.target.dataset.id);
    }
});

checkoutButton.addEventListener('click', () => {
    if (!cart.length) return;

    const total = cartGrandTotalSpan.textContent;
    if (confirm(`Total a pagar: ${CURRENCY_SYMBOL}${total}\n¿Desea continuar?`)) {
        cart = [];
        saveCart();
        updateCartUI();
        logInteraction('Compra realizada con éxito');
    }
});


function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const data = localStorage.getItem('cart');
    if (data) cart = JSON.parse(data);
}


document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateCartUI();
    checkStockAndDisableButtons();
    logInteraction('Tienda cargada correctamente');
});


const vaciarButton = document.getElementById('boton-vaciar');

vaciarButton.addEventListener('click', () => {
    if (cart.length === 0) return;

    if (!confirm('¿Seguro que deseas vaciar el carrito?')) return;

    cart.forEach(item => {
        updateStock(item.id, item.quantity);
    });

    cart.splice(0, cart.length);

    saveCart();
    updateCartUI();
    logInteraction('Carrito vaciado correctamente');
});


document.getElementById('filtro-stock').addEventListener('click', () => {
    document.querySelectorAll('.tarjeta').forEach(card => {
        const stock = parseInt(card.dataset.stock, 10);

        if (stock > 0 && stock <= 5) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});


document.getElementById('filtro-nvidia').addEventListener('click', () => {
    document.querySelectorAll('.tarjeta').forEach(card => {
        const marca = card.innerText.toLowerCase();
        card.style.display = marca.includes('nvidia') ? 'flex' : 'none';
    });
});

document.getElementById('filtro-descuento').addEventListener('click', () => {
    document.querySelectorAll('.tarjeta').forEach(card => {
        const descuento = parseInt(card.dataset.descuento || '0', 10);

        if (descuento > 15) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
});


document.getElementById('filtro-reset').addEventListener('click', () => {
    document.querySelectorAll('.tarjeta').forEach(card => {
        card.style.display = 'flex';
    });
});
