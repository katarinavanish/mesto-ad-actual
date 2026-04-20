/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { 
  getUserInfo, 
  getCardList, 
  setUserInfo, 
  setUserAvatar,
  addCard,
  deleteCardRequest,
  changeLikeCardStatus   
 } from "./components/api.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");
const cardSubmitButton = cardForm.querySelector(".popup__button");

const cardInfoModalWindow = document.querySelector(".popup_type_info");
const cardInfoModalInfoList = cardInfoModalWindow.querySelector(".popup__info");
const cardInfoModalUsersList = cardInfoModalWindow.querySelector(".popup__list");

const infoDefinitionTemplate = document.querySelector("#popup-info-definition-template").content;
const userPreviewTemplate = document.querySelector("#popup-info-user-preview-template").content;
const logoElement = document.querySelector(".logo");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");
const profileSubmitButton = profileForm.querySelector(".popup__button");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");
const avatarSubmitButton = avatarForm.querySelector(".popup__button");

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, profileSubmitButton, "Сохранение...");
  
  //заменили через API
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, profileSubmitButton);
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, avatarSubmitButton, "Сохранение...");

  //заменили через API
  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, avatarSubmitButton);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  renderLoading(true, cardSubmitButton, "Создание...");
  
  //заменили
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCard,
        }, currentUserId)
      );
      //
      cardFormModalWindow.querySelector(".popup__form").reset();
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, cardSubmitButton);
    });
};

const handleDeleteCard = (cardElement, cardId) => {
  
  deleteCardRequest(cardId)
    .then(() => {
      cardElement.remove(); // удаляем карточку из DOM
    })
    .catch((err) => {
      console.log(err);
    });
};

const handleLikeClick = (cardElement, cardData, isLiked) => {
  changeLikeCardStatus(cardData._id, isLiked)
    .then((updatedCard) => {
      const likeButton = cardElement.querySelector(".card__like-button");
      const likeCountElement = cardElement.querySelector(".card__like-count");

      likeCountElement.textContent = updatedCard.likes.length;

      // проверяем, лайкнул ли текущий пользователь
      const isNowLiked = updatedCard.likes.some(
        (user) => user._id === currentUserId
      );

      if (isNowLiked) {
        likeButton.classList.add("card__like-button_is-active");
      } else {
        likeButton.classList.remove("card__like-button_is-active");
      }
    })
    .catch((err) => {
      console.error("Ошибка при обновлении лайка:", err);
    });
};



//рендеринг
const renderLoading = (isLoading, buttonElement, loadingText) => {
  if (isLoading && !buttonElement.dataset.defaultText){
    buttonElement.dataset.defaultText = buttonElement.textContent;
  }
  if (isLoading) {
    buttonElement.textContent = loadingText;
  } else {
    buttonElement.textContent = buttonElement.dataset.defaultText || buttonElement.textContent;
  }
};

//создание строки статистики
const createInfoString = (title, value) => {
  const element = infoDefinitionTemplate
    .querySelector(".popup__info-item")
    .cloneNode(true);

  element.querySelector(".popup__info-term").textContent = title;
  element.querySelector(".popup__info-description").textContent = value;

  return element;
};

//создание элемента пользователя
const createUserPreview = (user) => {
  const element = userPreviewTemplate
    .querySelector(".popup__list-item")
    .cloneNode(true);

  element.textContent = user.name;
  return element;
};

//статистика карточек
const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      cardInfoModalInfoList.innerHTML = "";
      cardInfoModalUsersList.innerHTML = "";

      const users = new Set(cards.map(card => card.owner.name));

      const totalLikes = cards.reduce((sum, card) => {
        return sum + card.likes.length;
      }, 0);

      const likesByUser = {};
      cards.forEach((card) => {
        card.likes.forEach((user) => {
          if (!likesByUser[user.name]) {
            likesByUser[user.name] = 0;
          }
          likesByUser[user.name] += 1;
        });
      });

      let maxLikesFromUser = 0;      
      Object.values(likesByUser).forEach((count) => {
        if (count > maxLikesFromUser) {
          maxLikesFromUser = count;
        }
      });
      
      const likesByAuthor = {};
      cards.forEach((card) => {
        const author = card.owner.name;

        if (!likesByAuthor[author]) {
          likesByAuthor[author] = 0;
        }

        likesByAuthor[author] += card.likes.length;
      });

      let champion = "";
      let maxLikesForAuthor = 0;

      Object.entries(likesByAuthor).forEach(([author, likes]) => {
        if (likes > maxLikesForAuthor) {
          maxLikesForAuthor = likes;
          champion = author;
        }
      });

      const popularCards = [...cards]
        .sort((a, b) => b.likes.length - a.likes.length)
        .slice(0, 3);

      cardInfoModalInfoList.append(
        createInfoString("Всего пользователей:", users.size)
      );

      cardInfoModalInfoList.append(
        createInfoString("Всего лайков:", totalLikes)
      );

      cardInfoModalInfoList.append(
        createInfoString("Максимально лайков от одного:", maxLikesFromUser)
      );

      cardInfoModalInfoList.append(
        createInfoString("Чемпион лайков:", champion)
      );

      popularCards.forEach(card => {
        cardInfoModalUsersList.append(
          createUserPreview({ name: card.name })
        );
      });

      cardInfoModalWindow.querySelector(".popup__title").textContent =
        "Статистика карточек";

      cardInfoModalWindow.querySelector(".popup__text").textContent =
        "Популярные карточки:";

      openModalWindow(cardInfoModalWindow);
    })
    .catch((err) => console.log(err));
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
logoElement.addEventListener("click", handleLogoClick);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  //при открытии формы очищаем ошибки (1)
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  //при открытии формы очищаем ошибки (1)
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  //при открытии формы очищаем ошибки (1)
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});


//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

// 1
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

let currentUserId = null; // глобальная переменная для текущего пользователя

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    // id текущего пользователя
    currentUserId = userData._id;

    // данные пользователя
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    // карточки
    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeClick,
          onDeleteCard: handleDeleteCard,
        }, currentUserId) // currentUserId получаем из getUserInfo
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });