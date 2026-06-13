// 商品数据（代肝服务）
const products = [
    { id: 1, name: '保险 - 9格', price: 50.00, desc: 'RMB 50 / 哈夫币 1000w' },
    { id: 2, name: '保险 - 6格', price: 60.00, desc: 'RMB 60 / 哈夫币 1000w' }
];

// 购物车数据
let cart = [];
let selectedPayment = 'wechat';

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    setupFormHandler();
    setupEasterEgg();
});

// 渲染商品列表
function renderProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-name">${product.name}</div>
            <div class="product-desc">${product.desc}</div>
            <div class="product-price">¥${product.price.toFixed(2)}</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                加入清单
            </button>
        </div>
    `).join('');
}

// 添加到购物车
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    renderCart();
    showNotification(`[系统] ${product.name} 已添加`);
}

// 渲染购物车
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">[ 清单为空 ]</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">¥${item.price.toFixed(2)}</div>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
                </div>
            </div>
        `).join('');
    }
    
    updateSummary();
}

// 更新数量
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
        }
    }
}

// 从购物车移除
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
}

// 更新汇总信息
function updateSummary() {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalAmount').textContent = `¥${totalAmount.toFixed(2)}`;
}

// 选择支付方式
function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    document.getElementById('qrWechat').classList.toggle('active', method === 'wechat');
    document.getElementById('qrAlipay').classList.toggle('active', method === 'alipay');
}

// 设置表单提交处理
function setupFormHandler() {
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('[错误] 请先选择物资');
            return;
        }
        
        submitOrder();
    });
}

// 提交订单
function submitOrder() {
    const orderData = {
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        paymentMethod: selectedPayment === 'wechat' ? '微信支付' : '支付宝',
        remark: document.getElementById('remark').value,
        items: cart,
        totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderTime: new Date().toLocaleString('zh-CN')
    };
    
    // 发送到 Bark
    sendToBark(orderData);
    
    // 显示订单详情
    showOrderDetails(orderData);
    
    // 清空购物车和表单
    cart = [];
    renderCart();
    document.getElementById('orderForm').reset();
    selectPayment('wechat');
}

// 发送到 Bark 推送
async function sendToBark(orderData) {
    const barkKey = '9BQZpzNufz88CPZQxVZPdi';
    
    const itemsText = orderData.items.map(item => 
        `${item.name} × ${item.quantity}`
    ).join(', ');
    
    const title = `三角洲新订单 ¥${orderData.totalAmount.toFixed(2)}`;
    const body = `干员：${orderData.customerName}\n联络：${orderData.customerPhone}\n渠道：${orderData.paymentMethod}\n物资：${itemsText}${orderData.remark ? `\n备注：${orderData.remark}` : ''}`;
    
    try {
        await fetch(`https://api.day.app/${barkKey}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`);
    } catch (error) {
        console.error('Notification failed:', error);
    }
}

// 显示订单详情弹窗
function showOrderDetails(orderData) {
    const modal = document.getElementById('orderModal');
    const detailsDiv = document.getElementById('orderDetails');
    
    const itemsHtml = orderData.items.map(item => 
        `<div class="order-detail-row">${item.name} x ${item.quantity} = ¥${(item.price * item.quantity).toFixed(2)}</div>`
    ).join('');
    
    detailsDiv.innerHTML = `
        <div class="order-detail-row"><strong>时间：</strong>${orderData.orderTime}</div>
        <div class="order-detail-row"><strong>干员：</strong>${orderData.customerName}</div>
        <div class="order-detail-row"><strong>联络：</strong>${orderData.customerPhone}</div>
        <div class="order-detail-row"><strong>渠道：</strong>${orderData.paymentMethod}</div>
        <hr style="margin: 10px 0; border-color: #3a4a5a;">
        ${itemsHtml}
        <div class="order-detail-row" style="font-weight: bold; color: #ff9d00;">
            <strong>合计：</strong>¥${orderData.totalAmount.toFixed(2)}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// 关闭弹窗
function closeModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9d00;
        color: #000;
        padding: 15px 25px;
        font-weight: bold;
        box-shadow: 0 0 15px rgba(255, 157, 0, 0.5);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// 彩蛋逻辑
let clickCount = 0;
let clickTimer = null;

function setupEasterEgg() {
    const header = document.getElementById('triggerHeader');
    if (header) {
        header.addEventListener('click', triggerEasterEgg);
    }
}

function triggerEasterEgg(e) {
    // 防止点击弹窗内的图片时触发计数
    if (e && e.target.closest('.easter-egg-container')) return;

    clickCount++;
    
    if (clickTimer) clearTimeout(clickTimer);
    
    // 每次点击都让标题闪烁一下
    const title = document.getElementById('mainTitle');
    if (title) {
        title.style.color = '#f00';
        setTimeout(() => title.style.color = '', 100);
    }
    
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 2000); // 2秒内连续点击
    
    if (clickCount === 5) {
        showEasterEgg();
        clickCount = 0;
    }
}

function showEasterEgg() {
    console.log('[Debug] Easter egg triggered!');
    const container = document.getElementById('easterEggContainer');
    if (!container) {
        console.error('[Error] Container not found');
        return;
    }

    container.classList.remove('hidden');
    
    // 填充图片
    container.innerHTML = `
        <img src="easter-egg-1.jpeg" class="easter-egg-img" alt="Secret 1">
        <img src="easter-egg-2.jpeg" class="easter-egg-img" alt="Secret 2">
        <img src="easter-egg-3.jpg" class="easter-egg-img" alt="Secret 3">
    `;
    
    // 触发全屏故障特效
    document.body.classList.add('glitch-active');
    showNotification('[系统] ⚠️ 检测到非法入侵！机密档案已强制解锁');
    
    // 8秒后自动关闭
    setTimeout(() => {
        closeEasterEgg();
    }, 8000);
}

function closeEasterEgg() {
    const container = document.getElementById('easterEggContainer');
    if (container) {
        container.classList.add('hidden');
    }
    document.body.classList.remove('glitch-active');
}

// 点击背景关闭彩蛋
document.addEventListener('click', function(e) {
    const container = document.getElementById('easterEggContainer');
    if (container && !container.classList.contains('hidden') && !e.target.closest('.easter-egg-container')) {
        closeEasterEgg();
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
