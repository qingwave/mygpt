const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const chatContainer = document.getElementById("chat-container");

const {markedHighlight} = globalThis.markedHighlight;
const mk = new marked.Marked(
    markedHighlight({
      langPrefix: '',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language: language }).value;
      }
    })
);

userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

userInput.addEventListener("input", function() {
    if (userInput.value.trim() !== "") {
        // 如果输入框不为空，切换按钮样式为激活状态
        sendButton.classList.add("active-button");
    } else {
        // 如果输入框为空，切换按钮样式为默认状态
        sendButton.classList.remove("active-button");
    }
});

sendButton.addEventListener("click", () => {
    if (sendButton.classList.contains("active-button")) {
        // 只有在按钮为激活状态时才触发操作
        // 在此添加你想要执行的操作
        sendMessage()
    }
});

// 页面加载时，将存储在 localStorage 中的对话历史加载并显示
window.addEventListener("load", function() {
    const chatList = JSON.parse(localStorage.getItem("conversationList")) || [];
    savedConversationList = chatList;
    // 将保存的对话列表添加到页面
    if (savedConversationList) {
        savedConversationList.forEach((conversation) => {
            const conversationItem = createConversationItem(conversation.data, conversation.id);
            conversationList.appendChild(conversationItem);
            if (!currentChatID) {
                currentChatID = conversation.id;
                loadChatHistory(conversation.id);
                toggleActiveState(conversationItem);
            }
        });
    }
});

let currentChatID = null;

function loadChatHistory(id) {
    const storedChatHistory = JSON.parse(localStorage.getItem(id)) || [];
    chatHistory = storedChatHistory;
    chatBox.innerHTML = "";
    chatHistory.forEach(item => {
        appendMessage(item.role, item.content, item.role+"-message");
    });
    scrollToLatest();
}

function saveChatHistory(id, content) {
    localStorage.setItem(id, JSON.stringify(content));
}

function scrollToLatest() {
    chatContainer.scrollTop=chatContainer.scrollHeight
}

function sendMessage() {
    sendButton.classList.remove("active-button");
    const userMessage = userInput.value;

    if (!currentChatID) {
        const conversationItem = createConversationItem("New Chat");
        currentChatID=conversationItem.id;
        conversationList.appendChild(conversationItem);
        saveConversationList();
    }

    // 添加用户消息到对话历史
    saveMessage("user", userMessage);  // 修改 'User' 为 'user'
    userInput.value = "";

    // 发送用户消息到后端
    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: chatHistory })
    })
    .then(response => response.json())
    .then(data => {
        saveMessage("assistant", data.message);
    });
}

function saveMessage(role, content) {
    appendMessage(role, content, role+"-message");

    // 添加模型回复到对话历史
    chatHistory.push({ role: role, content: content }); 

    let childElement = chatBox.querySelector('#typing-message');
    if (childElement) {
        chatBox.removeChild(childElement);
    } else {
        appendTyping();
    }

    scrollToLatest();

    // 将对话历史保存到 localStorage
    localStorage.setItem(currentChatID, JSON.stringify(chatHistory));
    saveChatHistory(currentChatID, chatHistory)
}

// 创建一个空的对话历史数组
let chatHistory = [];

function appendMessage(role, message, cssClass) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-container", role);

    const avatarElement = document.createElement("div");
    avatarElement.classList.add("avatar", role + "-avatar");
    messageElement.appendChild(avatarElement);

    const contentElement = document.createElement("div");
    contentElement.classList.add("message-content", "prose");

    contentElement.innerHTML =  mk.parse(message);
    messageElement.appendChild(contentElement);

    if (cssClass) {
        messageElement.classList.add(cssClass);
    }

    chatBox.appendChild(messageElement);
}

function appendTyping() {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-container", "assistant", "assistant-message");
    messageElement.id = "typing-message";
    messageElement.innerHTML = '<div class="avatar assistant-avatar"></div><div class="typing"></div>';
    chatBox.appendChild(messageElement);
}

// 获取按钮和对话列表的引用
const newChatButton = document.getElementById("new-chat-button");
const conversationList = document.getElementById("conversation-list");
let activeConversationItem = null;  // 用于跟踪当前激活的对话项

let savedConversationList = [];

// 监听 "New Chat" 按钮点击事件
newChatButton.addEventListener("click", () => {
    // 创建新对话项
    const newConversationItem = createConversationItem("New Chat");
    
    // 将新对话项添加到对话列表
    conversationList.appendChild(newConversationItem);

    // 更新保存的对话列表
    saveConversationList();
});

// 创建新对话项的函数
function createConversationItem(data, id) {
    const conversationItem = document.createElement("li");
    conversationItem.className = "conversation-item";

    if (id) {
        conversationItem.id = id; // 设置对话项的ID
    } else {
        conversationItem.id = genUUID(); // 生成唯一ID
    }

    const icon = document.createElement("i");
    icon.className = "far fa-message";

    const conversationData = document.createElement("div");
    conversationData.className = "conversation-data";
    conversationData.textContent = data;

    const buttons = document.createElement("div");
    buttons.className = "conversation-buttons";

    const editButton = document.createElement("button");
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.addEventListener("click", () => {
        // 编辑标题的逻辑
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.value = conversationData.textContent;
        inputField.className = "edit-title-input";
        const originalTitle = conversationData.textContent; // 保存原标题
        inputField.focus();
    
        inputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                // 用户按下回车键时提交编辑
                conversationData.textContent = inputField.value;
                inputField.remove(); // 移除输入字段

                // 保存对话更改到 localStorage
                saveConversationList();
            }
        });

        inputField.addEventListener("blur", () => {
            // 失去焦点时提交编辑
            conversationData.textContent = originalTitle;
            inputField.remove(); // 移除输入字段
        })

        conversationData.innerHTML = "";
        conversationData.appendChild(inputField);
        inputField.select();
    });

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.addEventListener("click", () => {
        // 删除对话项的逻辑
        conversationList.removeChild(conversationItem);
        localStorage.removeItem(id);
        saveConversationList();
        chatHistory = []; // 清空对话历史
    });

    conversationItem.appendChild(icon);
    conversationItem.appendChild(conversationData);
    buttons.appendChild(editButton);
    buttons.appendChild(deleteButton);
    conversationItem.appendChild(buttons);

    conversationItem.addEventListener("click", () => {
        if (activeConversationItem) {
            // 移除前一个激活的对话项的激活状态样式
            activeConversationItem.classList.remove("active-conversation");
            // 隐藏前一个激活的对话项的按钮
            activeConversationItem.querySelector(".conversation-buttons").style.display = "none";
        }
        // 添加激活状态样式和显示按钮
        toggleActiveState(conversationItem);
        currentChatID = id;
        loadChatHistory(id);
    });

    return conversationItem;
}

// 切换对话项的激活状态
function toggleActiveState(item) {
    activeConversationItem = item;
    item.classList.add("active-conversation");
    const buttonsContainer = item.querySelector(".conversation-buttons");
    if (buttonsContainer.style.display === "block") {
        buttonsContainer.style.display = "none"; // 隐藏按钮
    } else {
        buttonsContainer.style.display = "block"; // 显示按钮
    }
}

// 保存对话列表到 localStorage
function saveConversationList() {
    const conversationItems = Array.from(conversationList.children);
    const savedConversations = conversationItems.map((item) => {
        const data = item.querySelector(".conversation-data").textContent;
        const id = item.id;
        return { id, data };
    });

    localStorage.setItem("conversationList", JSON.stringify(savedConversations));
}

document.getElementById("clear-all").addEventListener("click", function() {
    localStorage.clear(); // 清空 localStorage
    conversationList.innerHTML = ""; // 清空对话列表

    alert("Clear all chat done")
});

const genUUID = () =>
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
);
