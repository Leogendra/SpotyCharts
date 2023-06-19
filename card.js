// Card hover effect
const handleOnMouseMove = e => {
  const { currentTarget: target } = e;

  const rect = target.getBoundingClientRect();
  x = e.clientX - rect.left;
  y = e.clientY - rect.top;

  target.style.setProperty("--mouse-x", `${x}px`);
  target.style.setProperty("--mouse-y", `${y}px`);
}

for (const card of document.querySelectorAll(".choice")) {
  card.onmousemove = e => handleOnMouseMove(e);
}


// Titre hover
const rand = (min, max) => {
  Math.floor(Math.random() * (max - min + 1)) + min;
}


const enhance = id => {
  const element = document.querySelector(id);
  let text = element.innerText.split("");
  element.innerText = "";

  text.forEach(value => {
    const outer = document.createElement("span");
    outer.className = "letter";
    outer.innerText = value;
    element.appendChild(outer);
  });
}

enhance(".title");
