import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
  }

  addProduct(product) {
    if (!product) {
      return;
    }
    let isProduct = this.cartItems.find((item) => {
      return item.product.id === product.id;
    });
    if (!isProduct) {
      let newProduct = {};
      newProduct.product = product;
      newProduct.count = 1;
      this.cartItems.push(newProduct);
      this.onProductUpdate(newProduct);

    } else {
      isProduct.count++;
      this.onProductUpdate(isProduct);
    }
  }

  updateProductCount(productId, amount) {

    let targetUpdate = this.cartItems.find((item) => {
      return item.product.id === productId;
    });

    if (!targetUpdate) {
      return;
    }

    targetUpdate.count += amount;



    if (targetUpdate.count <= 0) {
      let number = this.cartItems.findIndex((item) => {
        return item.product.id === productId;

      });

      this.cartItems.splice(number, 1);
    }
    this.onProductUpdate(targetUpdate);
  }

  isEmpty() {

    return !this.cartItems.length;
  }

  getTotalCount() {
    let totalCount = 0;
    for (let i = 0; i < this.cartItems.length; i++) {
      totalCount += this.cartItems[i].count;
    }

    return totalCount;
  }

  getTotalPrice() {
    let totalPrice = 0;
    for (let i = 0; i < this.cartItems.length; i++) {
      totalPrice = totalPrice + this.cartItems[i].product.price * this.cartItems[i].count;
    }
    return totalPrice;
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${
      product.id
    }">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(
              2
            )}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modal = new Modal();
    this.modal.setTitle("Your order");
    this.renderModalBody();
    this.modal.open();
  }

  renderModalBody() {
    let div = document.createElement('div');

    for (let i = 0; i < this.cartItems.length; i++) {
      div.append(this.renderProduct(this.cartItems[i].product, this.cartItems[i].count));
    }
    div.addEventListener('click', this.modalChangeCount);
    div.append(this.renderOrderForm());
    let form = div.querySelector('.cart-form');
    form.addEventListener('submit', this.onSubmit);
    this.modal.setBody(div);
  }

  onProductUpdate(cartItem) {

    this.cartIcon.update(this);
    let isModalOpen = document.body.classList.contains('is-modal-open');
    if (!isModalOpen) {
      return;
    }

    if (this.isEmpty()) {
      this.modal.close();
      return;

    }

    let productId = cartItem.product.id;
    let modalBody = this.modal.elem;

    if (cartItem.count <= 0) {
      let product = modalBody.querySelector(`[data-product-id="${productId}"]`);
      product.remove();
    } else {
      let productCount = modalBody.querySelector(`[data-product-id="${productId}"] .cart-counter__count`);
      productCount.innerHTML = cartItem.count;

      let productPrice = modalBody.querySelector(`[data-product-id="${productId}"] .cart-product__price`);
      productPrice.innerHTML = `€${(cartItem.product.price * cartItem.count).toFixed(2)}`;
    }
    let infoPrice = modalBody.querySelector(`.cart-buttons__info-price`);
    infoPrice.innerHTML = `€${this.getTotalPrice().toFixed(2)}`;

  }

  onSubmit = (event) => {
    event.preventDefault();
    let form = event.currentTarget;
    let button = form.querySelector('[type="submit"]');
    button.classList.add('is-loading');

    let url = `https://httpbin.org/post`;
    let formData = new FormData(form);
    let result = fetch(url, {
      method: 'POST',
      body: formData
    });

    result.then((response) => {
      this.modal.setTitle('Success!');
      this.cartItems.length = 0;
      this.modal.setBody(createElement(`
        <div class="modal__body-inner">
          <p>
            Order successful! Your order is being cooked :) <br>
            We’ll notify you about delivery time shortly.<br>
            <img src="/assets/images/delivery.gif">
          </p>
        </div>
      `));
    });


  }

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }

  modalChangeCount = (e) => {
    let button = e.target.closest('.cart-counter__button');
    if (!button) {
      return;
    }

    let cartProduct = e.target.closest('.cart-product');
    let idProduct = cartProduct.dataset.productId;
    let amount = 0;
    if (button.classList.contains('cart-counter__button_minus')) {
      amount = -1;
    }

    if (button.classList.contains('cart-counter__button_plus')) {
      amount = 1;
    }

    this.updateProductCount(idProduct, amount);
  }
}

