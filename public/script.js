
const openTryOn = document.getElementById("openTryOn");
const tryonSection = document.getElementById("tryonSection");
const personImage = document.getElementById("personImage");
const choosePhoto = document.getElementById("choosePhoto");
const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const personPreview = document.getElementById("personPreview");
const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("status");
const resultSection = document.getElementById("resultSection");
const resultImage = document.getElementById("resultImage");
const downloadBtn = document.getElementById("downloadBtn");
const tryAgain = document.getElementById("tryAgain");

let uploadedFile = null;

openTryOn.addEventListener("click", () => {
  tryonSection.scrollIntoView({ behavior: "smooth" });
});

choosePhoto.addEventListener("click", () => {
  personImage.click();
});

personImage.addEventListener("change", () => {
  const file = personImage.files[0];

  if (!file) return;

  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    alert("Please select a JPG, PNG or WebP image.");
    personImage.value = "";
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("Please upload an image smaller than 10 MB.");
    personImage.value = "";
    return;
  }

  uploadedFile = file;

  const imageURL = URL.createObjectURL(file);
  personPreview.src = imageURL;

  uploadPlaceholder.classList.add("hidden");
  personPreview.classList.remove("hidden");

  generateBtn.disabled = false;
  statusText.textContent = "Your photo is ready.";
});

generateBtn.addEventListener("click", async () => {
  if (!uploadedFile) return;

  const formData = new FormData();
  formData.append("personImage", uploadedFile);

  generateBtn.disabled = true;
  generateBtn.textContent = "CREATING YOUR LOOK...";
  statusText.textContent = "AI is creating your virtual try-on. Please wait.";

  try {
    const response = await fetch("/api/try-on", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Try-on failed.");
    }

    resultImage.src = data.resultImageUrl;
    downloadBtn.href = data.resultImageUrl;

    resultSection.classList.remove("hidden");
    statusText.textContent = "Your look is ready!";

    resultSection.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "GENERATE MY LOOK";
  }
});

tryAgain.addEventListener("click", () => {
  resultSection.classList.add("hidden");
  tryonSection.scrollIntoView({ behavior: "smooth" });
});
