// Инициализация хранилища данных
function initializeStorage() {
  if (!localStorage.getItem("forumData")) {
    const initialData = {
      users: [
        {
          id: 1,
          username: "admin",
          password: "admin",
          isModerator: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
        },
      ],
      topics: [],
      posts: [],
      notifications: [],
    };
    localStorage.setItem("forumData", JSON.stringify(initialData));
  }
}

// Получение данных
function getForumData() {
  return (
    JSON.parse(localStorage.getItem("forumData")) || {
      users: [],
      topics: [],
      posts: [],
      notifications: [],
    }
  );
}

// Сохранение данных
function saveForumData(data) {
  localStorage.setItem("forumData", JSON.stringify(data));
}

// Текущий пользователь
let currentUser = null;

// DOM элементы
const authButtons = document.getElementById("auth-buttons");
const userInfo = document.getElementById("user-info");
const usernameDisplay = document.getElementById("username-display");
const logoutBtn = document.getElementById("logout-btn");
const profileBtn = document.getElementById("profile-btn");
const notificationsBtn = document.getElementById("notifications-btn");
const notificationCount = document.getElementById("notification-count");
const notificationPopup = document.getElementById("notification-popup");
const notificationList = document.getElementById("notification-list");
const clearNotificationsBtn = document.getElementById("clear-notifications");
const profilePopup = document.getElementById("profile-popup");
const profileContent = document.getElementById("profile-content");
const closeProfileBtn = document.getElementById("close-profile");
const moderationPanel = document.getElementById("moderation-panel");
const moderationList = document.getElementById("moderation-list");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");
const closeButtons = document.querySelectorAll(".close");
const submitLogin = document.getElementById("submit-login");
const submitRegister = document.getElementById("submit-register");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const registerUsername = document.getElementById("register-username");
const registerPassword = document.getElementById("register-password");
const registerConfirm = document.getElementById("register-confirm");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");
const createTopicBtn = document.getElementById("create-topic-btn");
const topicsList = document.getElementById("topics-list");
const topicView = document.getElementById("topic-view");
const topicTitle = document.getElementById("topic-title");
const topicActions = document.getElementById("topic-actions");
const postsContainer = document.getElementById("posts-container");
const replyContent = document.getElementById("reply-content");
const submitReply = document.getElementById("submit-reply");
const createTopicForm = document.getElementById("create-topic-form");
const topicName = document.getElementById("topic-name");
const topicFirstPost = document.getElementById("topic-first-post");
const submitTopic = document.getElementById("submit-topic");
const cancelTopic = document.getElementById("cancel-topic");
const editTopicForm = document.getElementById("edit-topic-form");
const editTopicName = document.getElementById("edit-topic-name");
const saveTopicBtn = document.getElementById("save-topic");
const cancelEditBtn = document.getElementById("cancel-edit");
const pinTopicBtn = document.getElementById("pin-topic-btn");
const closeTopicBtn = document.getElementById("close-topic-btn");
const searchInput = document.getElementById("search-input");
const filterSelect = document.getElementById("filter-select");

// Инициализация приложения
function init() {
  initializeStorage();
  setupEventListeners();
  checkAuth();
  loadTopics();
}

// Загрузка тем с фильтрацией
function loadTopics(filter = "", filterType = "all") {
  const forumData = getForumData();
  topicsList.innerHTML = "";

  let filteredTopics = forumData.topics;

  // Применение текстового фильтра
  if (filter) {
    filteredTopics = filteredTopics.filter((topic) =>
      topic.title.toLowerCase().includes(filter.toLowerCase())
    );
  }

  // Применение типа фильтра
  if (currentUser) {
    if (filterType === "my") {
      filteredTopics = filteredTopics.filter(
        (topic) => topic.authorId === currentUser.id
      );
    } else if (filterType === "participated") {
      const userPosts = forumData.posts.filter(
        (post) => post.authorId === currentUser.id
      );
      const participatedTopicIds = [
        ...new Set(userPosts.map((post) => post.topicId)),
      ];
      filteredTopics = filteredTopics.filter((topic) =>
        participatedTopicIds.includes(topic.id)
      );
    }
  }

  // Сначала закрепленные, затем обычные
  const pinnedTopics = filteredTopics.filter((topic) => topic.isPinned);
  const normalTopics = filteredTopics.filter((topic) => !topic.isPinned);

  pinnedTopics.forEach((topic) => {
    topicsList.appendChild(createTopicElement(topic));
  });

  normalTopics.forEach((topic) => {
    topicsList.appendChild(createTopicElement(topic));
  });

  if (filteredTopics.length === 0) {
    topicsList.innerHTML = '<p class="no-topics">Темы не найдены</p>';
  }
}

// Создание элемента темы
function createTopicElement(topic) {
  const forumData = getForumData();
  const author = forumData.users.find((u) => u.id === topic.authorId);
  const topicPosts = forumData.posts.filter(
    (p) => p.topicId === topic.id && p.status === "approved"
  );

  const topicElement = document.createElement("div");
  topicElement.className = `topic-item ${
    topic.isPinned ? "pinned-topic" : ""
  } ${topic.isClosed ? "closed-topic" : ""}`;
  topicElement.dataset.topicId = topic.id;

  topicElement.innerHTML = `
        <h3>${topic.title} ${topic.isClosed ? "(Закрыта)" : ""}</h3>
        <div class="topic-meta">
            Автор: ${author ? author.username : "Неизвестно"} | 
            Дата: ${new Date(topic.createdAt).toLocaleDateString()} | 
            Сообщений: ${topicPosts.length} | 
            Последнее: ${getLastPostDate(topic.id)}
        </div>
    `;

  topicElement.addEventListener("click", () => showTopic(topic.id));

  return topicElement;
}

// Получение даты последнего сообщения
function getLastPostDate(topicId) {
  const forumData = getForumData();
  const topicPosts = forumData.posts.filter(
    (p) => p.topicId === topicId && p.status === "approved"
  );

  if (topicPosts.length === 0) return "нет сообщений";

  const lastPost = topicPosts.reduce((latest, post) => {
    return new Date(post.createdAt) > new Date(latest.createdAt)
      ? post
      : latest;
  }, topicPosts[0]);

  return new Date(lastPost.createdAt).toLocaleDateString();
}

// Показать тему и сообщения
function showTopic(topicId) {
  const forumData = getForumData();
  const topic = forumData.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topicTitle.textContent = topic.title;
  topicTitle.dataset.topicId = topic.id;
  postsContainer.innerHTML = "";

  // Управление темой (редактирование, удаление)
  updateTopicActions(topic);

  // Получение сообщений
  const topicPosts = forumData.posts.filter(
    (p) =>
      p.topicId === topicId &&
      (p.status === "approved" ||
        (currentUser &&
          (currentUser.isModerator || p.authorId === currentUser.id)))
  );

  topicPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  topicPosts.forEach((post) => {
    const postElement = createPostElement(post, topic);
    postsContainer.appendChild(postElement);
  });

  // Настройка формы ответа
  replyContent.disabled = !currentUser || topic.isClosed;
  if (topic.isClosed) {
    replyContent.placeholder = "Тема закрыта для новых сообщений";
  }

  topicsList.style.display = "none";
  topicView.style.display = "block";
  createTopicForm.style.display = "none";
  editTopicForm.style.display = "none";
}

// Создание элемента сообщения
function createPostElement(post, topic) {
  const forumData = getForumData();
  const author = forumData.users.find((u) => u.id === post.authorId);

  const postElement = document.createElement("div");
  postElement.className = `post ${post.status}`;
  postElement.dataset.postId = post.id;

  postElement.innerHTML = `
        <div class="post-author">${
          author ? author.username : "Неизвестно"
        }</div>
        <div class="post-date">${new Date(
          post.createdAt
        ).toLocaleString()}</div>
        <div class="post-content">${post.content}</div>
    `;

  // Кнопки управления для автора или модератора
  if (
    currentUser &&
    (currentUser.id === post.authorId || currentUser.isModerator)
  ) {
    const postActions = document.createElement("div");
    postActions.className = "post-actions";

    if (currentUser.id === post.authorId || currentUser.isModerator) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "Редактировать";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        editPost(post);
      });
      postActions.appendChild(editBtn);
    }

    if (currentUser.id === post.authorId || currentUser.isModerator) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Удалить";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deletePost(post.id);
      });
      postActions.appendChild(deleteBtn);
    }

    postElement.appendChild(postActions);
  }

  // Кнопки модерации для модераторов
  if (currentUser && currentUser.isModerator && post.status === "pending") {
    const moderatorControls = document.createElement("div");
    moderatorControls.className = "moderator-controls";
    moderatorControls.innerHTML = `
            <button class="approve-post" data-post-id="${post.id}">Одобрить</button>
            <button class="reject-post" data-post-id="${post.id}">Отклонить</button>
        `;

    moderatorControls
      .querySelector(".approve-post")
      .addEventListener("click", (e) => {
        moderatePost(post.id, "approved");
        e.stopPropagation();
      });

    moderatorControls
      .querySelector(".reject-post")
      .addEventListener("click", (e) => {
        moderatePost(post.id, "rejected");
        e.stopPropagation();
      });

    postElement.appendChild(moderatorControls);
  }

  return postElement;
}

// Обновление кнопок управления темой
function updateTopicActions(topic) {
  topicActions.innerHTML = "";

  if (!currentUser) return;

  if (currentUser.id === topic.authorId || currentUser.isModerator) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "Редактировать";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showEditTopicForm(topic);
    });
    topicActions.appendChild(editBtn);
  }

  if (currentUser.id === topic.authorId || currentUser.isModerator) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTopic(topic.id);
    });
    topicActions.appendChild(deleteBtn);
  }
}

// Показать форму редактирования темы
function showEditTopicForm(topic) {
  editTopicName.value = topic.title;
  editTopicForm.dataset.topicId = topic.id;

  // Настройка кнопок для модераторов
  if (currentUser.isModerator) {
    pinTopicBtn.textContent = topic.isPinned
      ? "Открепить тему"
      : "Закрепить тему";
    closeTopicBtn.textContent = topic.isClosed
      ? "Открыть тему"
      : "Закрыть тему";
  } else {
    pinTopicBtn.style.display = "none";
    closeTopicBtn.style.display = "none";
  }

  topicView.style.display = "none";
  editTopicForm.style.display = "block";
}

// Сохранение изменений темы
function saveTopicChanges() {
  const topicId = parseInt(editTopicForm.dataset.topicId);
  const newTitle = editTopicName.value.trim();

  if (!newTitle) {
    alert("Введите название темы");
    return;
  }

  const forumData = getForumData();
  const topicIndex = forumData.topics.findIndex((t) => t.id === topicId);

  if (topicIndex !== -1) {
    forumData.topics[topicIndex].title = newTitle;
    saveForumData(forumData);

    editTopicForm.style.display = "none";
    showTopic(topicId);
    loadTopics(searchInput.value, filterSelect.value);
  }
}

// Закрепить/открепить тему
function togglePinTopic() {
  const topicId = parseInt(editTopicForm.dataset.topicId);
  const forumData = getForumData();
  const topicIndex = forumData.topics.findIndex((t) => t.id === topicId);

  if (topicIndex !== -1) {
    forumData.topics[topicIndex].isPinned =
      !forumData.topics[topicIndex].isPinned;
    saveForumData(forumData);

    editTopicForm.style.display = "none";
    showTopic(topicId);
    loadTopics(searchInput.value, filterSelect.value);
  }
}

// Закрыть/открыть тему
function toggleCloseTopic() {
  const topicId = parseInt(editTopicForm.dataset.topicId);
  const forumData = getForumData();
  const topicIndex = forumData.topics.findIndex((t) => t.id === topicId);

  if (topicIndex !== -1) {
    forumData.topics[topicIndex].isClosed =
      !forumData.topics[topicIndex].isClosed;
    saveForumData(forumData);

    editTopicForm.style.display = "none";
    showTopic(topicId);
    loadTopics(searchInput.value, filterSelect.value);
  }
}

// Удалить тему
function deleteTopic(topicId) {
  if (
    !confirm(
      "Вы уверены, что хотите удалить эту тему? Все сообщения в ней также будут удалены."
    )
  )
    return;

  const forumData = getForumData();

  // Удаление темы
  forumData.topics = forumData.topics.filter((t) => t.id !== topicId);

  // Удаление сообщений темы
  forumData.posts = forumData.posts.filter((p) => p.topicId !== topicId);

  saveForumData(forumData);

  topicView.style.display = "none";
  topicsList.style.display = "block";
  loadTopics(searchInput.value, filterSelect.value);
}

// Редактировать сообщение
function editPost(post) {
  const newContent = prompt("Редактировать сообщение:", post.content);
  if (newContent === null || newContent.trim() === "") return;

  const forumData = getForumData();
  const postIndex = forumData.posts.findIndex((p) => p.id === post.id);

  if (postIndex !== -1) {
    forumData.posts[postIndex].content = newContent.trim();
    forumData.posts[postIndex].status = currentUser.isModerator
      ? "approved"
      : "pending";
    forumData.posts[postIndex].updatedAt = new Date().toISOString();
    saveForumData(forumData);

    // Уведомление модераторам, если нужно
    if (!currentUser.isModerator) {
      const topic = forumData.topics.find((t) => t.id === post.topicId);
      notifyModerators(
        `Сообщение в теме "${topic.title}" было отредактировано и требует проверки.`
      );
    }

    showTopic(post.topicId);
  }
}

// Удалить сообщение
function deletePost(postId) {
  if (!confirm("Вы уверены, что хотите удалить это сообщение?")) return;

  const forumData = getForumData();
  const post = forumData.posts.find((p) => p.id === postId);

  if (post) {
    forumData.posts = forumData.posts.filter((p) => p.id !== postId);
    saveForumData(forumData);

    showTopic(post.topicId);
  }
}

// Модерировать сообщение
function moderatePost(postId, status) {
  const forumData = getForumData();
  const postIndex = forumData.posts.findIndex((p) => p.id === postId);

  if (postIndex !== -1) {
    forumData.posts[postIndex].status = status;
    saveForumData(forumData);

    // Уведомление автору
    const post = forumData.posts[postIndex];
    const topic = forumData.topics.find((t) => t.id === post.topicId);
    const message =
      status === "approved"
        ? `Ваше сообщение в теме "${topic.title}" было одобрено.`
        : `Ваше сообщение в теме "${topic.title}" было отклонено.`;

    addNotification(post.authorId, message);

    showTopic(post.topicId);
    updateModerationPanel();
  }
}

// Создать новую тему
function createNewTopic(title, content) {
  if (!currentUser) return;

  const forumData = getForumData();
  const newTopic = {
    id: Date.now(),
    title,
    authorId: currentUser.id,
    createdAt: new Date().toISOString(),
    isClosed: false,
    isPinned: false,
    updatedAt: null,
  };

  const newPost = {
    id: Date.now() + 1,
    topicId: newTopic.id,
    authorId: currentUser.id,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    status: currentUser.isModerator ? "approved" : "pending",
  };

  forumData.topics.push(newTopic);
  forumData.posts.push(newPost);
  saveForumData(forumData);

  // Уведомление модераторам, если нужно
  if (!currentUser.isModerator) {
    notifyModerators(`Новая тема "${title}" требует модерации.`);
  }

  // Уведомление автору
  const message = currentUser.isModerator
    ? `Ваша тема "${title}" была создана и автоматически одобрена.`
    : `Ваша тема "${title}" была создана и ожидает модерации.`;
  addNotification(currentUser.id, message);

  topicName.value = "";
  topicFirstPost.value = "";
  createTopicForm.style.display = "none";
  topicsList.style.display = "block";

  loadTopics(searchInput.value, filterSelect.value);
}

// Добавить ответ в тему
function addReply(content) {
  if (!currentUser || topicView.style.display !== "block") return;

  const topicId = parseInt(topicTitle.dataset.topicId);
  const forumData = getForumData();
  const topic = forumData.topics.find((t) => t.id === topicId);

  if (!topic || topic.isClosed) {
    alert("Эта тема закрыта для новых сообщений");
    return;
  }

  const newPost = {
    id: Date.now(),
    topicId,
    authorId: currentUser.id,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    status: currentUser.isModerator ? "approved" : "pending",
  };

  forumData.posts.push(newPost);
  saveForumData(forumData);
  replyContent.value = "";

  // Уведомление модераторам, если нужно
  if (!currentUser.isModerator) {
    notifyModerators(
      `Новое сообщение в теме "${topic.title}" требует модерации.`
    );
  }

  // Уведомление автору
  const message = currentUser.isModerator
    ? `Ваше сообщение в теме "${topic.title}" было добавлено.`
    : `Ваше сообщение в теме "${topic.title}" было отправлено на модерацию.`;
  addNotification(currentUser.id, message);

  showTopic(topicId);
}

// Уведомить модераторов
function notifyModerators(message) {
  const forumData = getForumData();
  const moderators = forumData.users.filter((u) => u.isModerator);

  moderators.forEach((moderator) => {
    addNotification(moderator.id, message);
  });
}

// Добавить уведомление
function addNotification(userId, message) {
  const forumData = getForumData();

  const notification = {
    id: Date.now(),
    userId,
    message,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  forumData.notifications.push(notification);
  saveForumData(forumData);

  // Обновить счетчик для текущего пользователя
  if (currentUser && currentUser.id === userId) {
    updateNotificationCount();
  }
}

// Обновить счетчик уведомлений
function updateNotificationCount() {
  if (!currentUser) return;

  const forumData = getForumData();
  const unreadCount = forumData.notifications.filter(
    (n) => n.userId === currentUser.id && !n.isRead
  ).length;
  notificationCount.textContent = unreadCount;
}

// Показать уведомления
function showNotifications() {
  if (!currentUser) return;

  const forumData = getForumData();
  const userNotifications = forumData.notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  notificationList.innerHTML = "";

  if (userNotifications.length === 0) {
    notificationList.innerHTML = "<li>Нет уведомлений</li>";
  } else {
    userNotifications.forEach((notification) => {
      const li = document.createElement("li");
      li.innerHTML = `
                <p>${notification.message}</p>
                <small>${new Date(
                  notification.createdAt
                ).toLocaleString()}</small>
            `;

      if (!notification.isRead) {
        li.style.fontWeight = "bold";
      }

      li.addEventListener("click", () =>
        markNotificationAsRead(notification.id)
      );
      notificationList.appendChild(li);
    });
  }

  notificationPopup.style.display = "block";
}

// Пометить уведомление как прочитанное
function markNotificationAsRead(notificationId) {
  const forumData = getForumData();
  const notificationIndex = forumData.notifications.findIndex(
    (n) => n.id === notificationId
  );

  if (notificationIndex !== -1) {
    forumData.notifications[notificationIndex].isRead = true;
    saveForumData(forumData);
    updateNotificationCount();
    showNotifications();
  }
}

// Очистить все уведомления
function clearAllNotifications() {
  if (!currentUser) return;

  const forumData = getForumData();
  forumData.notifications = forumData.notifications.filter(
    (n) => n.userId !== currentUser.id
  );
  saveForumData(forumData);

  updateNotificationCount();
  showNotifications();
}

// Показать профиль пользователя
function showUserProfile() {
  if (!currentUser) return;

  const forumData = getForumData();

  // Статистика пользователя
  const userTopics = forumData.topics.filter(
    (t) => t.authorId === currentUser.id
  ).length;
  const userPosts = forumData.posts.filter(
    (p) => p.authorId === currentUser.id
  ).length;
  const approvedPosts = forumData.posts.filter(
    (p) => p.authorId === currentUser.id && p.status === "approved"
  ).length;

  profileContent.innerHTML = `
        <div class="user-info">
            <p><strong>Имя пользователя:</strong> ${currentUser.username}</p>
            <p><strong>Роль:</strong> ${
              currentUser.isModerator ? "Модератор" : "Пользователь"
            }</p>
            <p><strong>Дата регистрации:</strong> ${new Date(
              currentUser.createdAt
            ).toLocaleDateString()}</p>
            ${
              currentUser.lastLogin
                ? `<p><strong>Последний вход:</strong> ${new Date(
                    currentUser.lastLogin
                  ).toLocaleString()}</p>`
                : ""
            }
        </div>
        <div class="user-stats">
            <h4>Статистика</h4>
            <p><strong>Создано тем:</strong> ${userTopics}</p>
            <p><strong>Написано сообщений:</strong> ${userPosts}</p>
            <p><strong>Одобрено сообщений:</strong> ${approvedPosts}</p>
        </div>
    `;

  profilePopup.style.display = "block";
}

// Обновить панель модерации
function updateModerationPanel() {
  if (!currentUser || !currentUser.isModerator) {
    moderationPanel.style.display = "none";
    return;
  }

  const forumData = getForumData();
  const pendingPosts = forumData.posts.filter((p) => p.status === "pending");

  moderationList.innerHTML = "";

  if (pendingPosts.length === 0) {
    moderationList.innerHTML = "<li>Нет сообщений на модерацию</li>";
  } else {
    pendingPosts.forEach((post) => {
      const topic = forumData.topics.find((t) => t.id === post.topicId);
      const author = forumData.users.find((u) => u.id === post.authorId);

      const li = document.createElement("li");
      li.innerHTML = `
                <strong>Тема:</strong> ${topic.title}<br>
                <strong>Автор:</strong> ${author.username}<br>
                <strong>Сообщение:</strong> ${post.content.substring(0, 50)}...
                <div class="moderator-controls">
                    <button class="approve-post" data-post-id="${
                      post.id
                    }">Одобрить</button>
                    <button class="reject-post" data-post-id="${
                      post.id
                    }">Отклонить</button>
                </div>
            `;

      li.querySelector(".approve-post").addEventListener("click", () =>
        moderatePost(post.id, "approved")
      );
      li.querySelector(".reject-post").addEventListener("click", () =>
        moderatePost(post.id, "rejected")
      );

      moderationList.appendChild(li);
    });
  }

  moderationPanel.style.display = "block";
}

// Проверка авторизации
function checkAuth() {
  const forumData = getForumData();
  const authUser = JSON.parse(localStorage.getItem("authUser"));

  if (authUser) {
    currentUser = forumData.users.find((u) => u.id === authUser.id);

    if (currentUser) {
      // Обновить время последнего входа
      currentUser.lastLogin = new Date().toISOString();
      forumData.users = forumData.users.map((u) =>
        u.id === currentUser.id ? currentUser : u
      );
      saveForumData(forumData);

      authButtons.style.display = "none";
      userInfo.style.display = "flex";
      usernameDisplay.textContent = currentUser.username;

      if (currentUser.isModerator) {
        updateModerationPanel();
      } else {
        moderationPanel.style.display = "none";
      }

      updateNotificationCount();
      return;
    }
  }

  // Если пользователь не авторизован
  currentUser = null;
  localStorage.removeItem("authUser");
  authButtons.style.display = "flex";
  userInfo.style.display = "none";
  moderationPanel.style.display = "none";
  notificationCount.textContent = "0";
}

// Вход
function login(username, password) {
  const forumData = getForumData();
  const user = forumData.users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    currentUser = user;
    localStorage.setItem("authUser", JSON.stringify({ id: user.id }));

    // Обновить время последнего входа
    user.lastLogin = new Date().toISOString();
    forumData.users = forumData.users.map((u) => (u.id === user.id ? user : u));
    saveForumData(forumData);

    checkAuth();
    closeModal(loginModal);
    loginError.textContent = "";
    loadTopics();
  } else {
    loginError.textContent = "Неверное имя пользователя или пароль";
  }
}

// Регистрация
function register(username, password) {
  const forumData = getForumData();

  if (username.length < 3) {
    registerError.textContent =
      "Имя пользователя должно быть не менее 3 символов";
    return;
  }

  if (password.length < 6) {
    registerError.textContent = "Пароль должен быть не менее 6 символов";
    return;
  }

  if (password !== registerConfirm.value) {
    registerError.textContent = "Пароли не совпадают";
    return;
  }

  if (forumData.users.some((u) => u.username === username)) {
    registerError.textContent = "Имя пользователя уже занято";
    return;
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
    isModerator: false,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };

  forumData.users.push(newUser);
  saveForumData(forumData);
  currentUser = newUser;
  localStorage.setItem("authUser", JSON.stringify({ id: newUser.id }));

  checkAuth();
  closeModal(registerModal);
  registerError.textContent = "";
  loadTopics();

  // Уведомление администратору
  const admin = forumData.users.find((u) => u.isModerator);
  if (admin) {
    addNotification(
      admin.id,
      `Новый пользователь зарегистрирован: ${username}`
    );
  }
}

// Выход
function logout() {
  currentUser = null;
  localStorage.removeItem("authUser");
  checkAuth();
  topicsList.style.display = "block";
  topicView.style.display = "none";
  createTopicForm.style.display = "none";
  editTopicForm.style.display = "none";
  notificationPopup.style.display = "none";
  profilePopup.style.display = "none";
  loadTopics();
}

// Открытие модального окна
function openModal(modal) {
  modal.style.display = "block";
}

// Закрытие модального окна
function closeModal(modal) {
  modal.style.display = "none";
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Кнопки авторизации
  loginBtn.addEventListener("click", () => openModal(loginModal));
  registerBtn.addEventListener("click", () => openModal(registerModal));
  logoutBtn.addEventListener("click", logout);
  profileBtn.addEventListener("click", showUserProfile);

  // Модальные окна
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      closeModal(this.closest(".modal"));
    });
  });

  // Клик вне модального окна
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target);
    }
  });

  // Форма входа
  submitLogin.addEventListener("click", () => {
    login(loginUsername.value, loginPassword.value);
  });

  // Форма регистрации
  submitRegister.addEventListener("click", () => {
    register(registerUsername.value, registerPassword.value);
  });

  // Уведомления
  notificationsBtn.addEventListener("click", showNotifications);
  clearNotificationsBtn.addEventListener("click", clearAllNotifications);
  closeProfileBtn.addEventListener("click", () => {
    profilePopup.style.display = "none";
  });

  // Клик вне попапов
  window.addEventListener("click", (e) => {
    if (
      e.target !== notificationsBtn &&
      !notificationPopup.contains(e.target)
    ) {
      notificationPopup.style.display = "none";
    }

    if (e.target !== profileBtn && !profilePopup.contains(e.target)) {
      profilePopup.style.display = "none";
    }
  });

  // Создание темы
  createTopicBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Для создания темы необходимо войти в систему");
      return;
    }

    topicsList.style.display = "none";
    topicView.style.display = "none";
    createTopicForm.style.display = "block";
  });

  cancelTopic.addEventListener("click", () => {
    createTopicForm.style.display = "none";
    topicsList.style.display = "block";
  });

  submitTopic.addEventListener("click", () => {
    if (!topicName.value.trim() || !topicFirstPost.value.trim()) {
      alert("Заполните все поля");
      return;
    }

    createNewTopic(topicName.value.trim(), topicFirstPost.value.trim());
  });

  // Ответ в теме
  submitReply.addEventListener("click", () => {
    if (!replyContent.value.trim()) {
      alert("Введите текст сообщения");
      return;
    }

    addReply(replyContent.value.trim());
  });

  // Поиск и фильтрация
  searchInput.addEventListener("input", () => {
    loadTopics(searchInput.value, filterSelect.value);
  });

  filterSelect.addEventListener("change", () => {
    loadTopics(searchInput.value, filterSelect.value);
  });

  // Редактирование темы
  saveTopicBtn.addEventListener("click", saveTopicChanges);
  cancelEditBtn.addEventListener("click", () => {
    editTopicForm.style.display = "none";
    topicView.style.display = "block";
  });

  pinTopicBtn.addEventListener("click", togglePinTopic);
  closeTopicBtn.addEventListener("click", toggleCloseTopic);

  // Enter для отправки форм
  loginPassword.addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitLogin.click();
  });

  registerConfirm.addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitRegister.click();
  });

  replyContent.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.ctrlKey) submitReply.click();
  });
}

// Запуск приложения
document.addEventListener("DOMContentLoaded", init);
