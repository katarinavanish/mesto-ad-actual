const getTemplate = () => {
  return document
    .getElementById("card-template")
    .content.querySelector(".card")
    .cloneNode(true);
};

export const createCardElement = (
  cardData,
  { onPreviewPicture, onLikeIcon, onDeleteCard },
  currentUserId
) => {
  const cardElement = getTemplate();
  const likeButton = cardElement.querySelector(".card__like-button");
  const deleteButton = cardElement.querySelector(".card__control-button_type_delete");
  const cardImage = cardElement.querySelector(".card__image");
  const likeCountElement = cardElement.querySelector(".card__like-count");

  cardImage.src = cardData.link;
  cardImage.alt = cardData.name;
  cardElement.querySelector(".card__title").textContent = cardData.name;
  likeCountElement.textContent = cardData.likes.length;

  // Показ иконки удаления только для автора
  if (cardData.owner._id !== currentUserId) {
    deleteButton.remove();
  } else {
    deleteButton.addEventListener("click", () => {
      onDeleteCard(cardElement, cardData._id);
    });
  }

  likeButton.addEventListener("click", () => {
    const isLiked = likeButton.classList.contains("card__like-button_is-active");
    onLikeIcon(cardElement, cardData, isLiked);
  });

  if (cardData.likes.some(user => user._id === currentUserId)) {
    likeButton.classList.add("card__like-button_is-active");
  }
  
  cardImage.addEventListener("click", () => {
    onPreviewPicture({ name: cardData.name, link: cardData.link });
  });

  return cardElement;
};
