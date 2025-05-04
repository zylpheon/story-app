import StoryService from "../../data/story-service";
import AuthService from "../../data/auth-service";

export default class AddStoryPage {
  #addStoryForm = null;
  #photoPreview = null;
  #photoInput = null;
  #locationCheckbox = null;
  #locationFields = null;
  #latInput = null;
  #lonInput = null;
  #isSubmitting = false;

  async render() {
    return `
      <section class="container" role="region" aria-labelledby="add-story-title">
        <div class="add-story-header">
          <h1 id="add-story-title">Add New Story</h1>
        </div>
        
        <div class="add-story-form-container">
          <form id="add-story-form" class="add-story-form" aria-label="Add story form">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" rows="4" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="photo">Photo</label>
              <div class="photo-input-options">
                <input type="file" id="photo" name="photo" accept="image/*" capture="environment" required>
                <button type="button" id="open-camera" class="btn btn-primary">Use Camera</button>
              </div>
              <div id="camera-container" class="camera-container" style="display: none;">
                <video id="camera-preview" autoplay playsinline></video>
                <div class="camera-controls">
                  <button type="button" id="capture-photo" class="btn btn-primary">Capture</button>
                  <button type="button" id="close-camera" class="btn btn-primary">Cancel</button>
                </div>
              </div>
              <div id="photo-preview" class="photo-preview">
                <p>No photo selected</p>
              </div>
            </div>
            
            <div class="form-group">
              <div class="checkbox-container">
                <label for="include-location" class="checkbox-label">
                  <span>Include my current location</span>
                  <input type="checkbox" id="include-location" name="include-location">
                </label>
              </div>
            </div>
            
            <div id="location-fields" class="location-fields" style="display: none;">
              <div class="form-group">
                <label for="latitude">Latitude</label>
                <input type="number" id="latitude" name="latitude" step="any">
              </div>
              
              <div class="form-group">
                <label for="longitude">Longitude</label>
                <input type="number" id="longitude" name="longitude" step="any">
              </div>
              
              <div class="location-buttons">
                <button type="button" id="get-location" class="btn btn-primary">Get My Location</button>
                <button type="button" id="select-on-map" class="btn btn-primary">Select on Map</button>
              </div>
              
              <div id="location-map-container" class="location-map-container" style="display: none;">
                <div id="location-map" class="location-map"></div>
                <p class="map-instructions">Click on the map to select a location</p>
                <button type="button" id="close-map" class="btn btn-primary">Done</button>
              </div>
            </div>
            
            <div class="form-actions centered">
              <a href="#/" class="btn btn-primary">Cancel</a>
              <button type="submit" id="submit-button" class="btn btn-primary">Submit Story</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#addStoryForm = document.getElementById("add-story-form");
    this.#photoPreview = document.getElementById("photo-preview");
    this.#photoInput = document.getElementById("photo");
    this.#locationCheckbox = document.getElementById("include-location");
    this.#locationFields = document.getElementById("location-fields");
    this.#latInput = document.getElementById("latitude");
    this.#lonInput = document.getElementById("longitude");

    this.#initPhotoPreview();
    this.#initLocationToggle();
    this.#initGetLocationButton();
    this.#initMapLocationSelector();
    this.#initCameraCapture();
    this.#initFormSubmit();

    StoryService.registerPushNotification();
  }

  #initPhotoPreview() {
    this.#photoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];

      if (!file) {
        this.#photoPreview.innerHTML = "<p>No photo selected</p>";
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        this.#compressImage(e.target.result, file.name).then(
          (compressedFile) => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(compressedFile);

            this.#photoInput.files = dataTransfer.files;

            const compressedImageUrl = URL.createObjectURL(compressedFile);
            this.#photoPreview.innerHTML = `<img src="${compressedImageUrl}" alt="Preview of uploaded photo: ${
              file.name
            }">
                                          <p class="file-info">Size: ${Math.round(
                                            compressedFile.size / 1024
                                          )}KB</p>`;
          }
        );
      };

      reader.readAsDataURL(file);
    });
  }

  #initLocationToggle() {
    this.#locationCheckbox.addEventListener("change", (event) => {
      if (event.target.checked) {
        this.#locationFields.style.display = "block";
      } else {
        this.#locationFields.style.display = "none";
        this.#latInput.value = "";
        this.#lonInput.value = "";
      }
    });
  }

  #initGetLocationButton() {
    const getLocationButton = document.getElementById("get-location");

    getLocationButton.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      getLocationButton.textContent = "Getting location...";
      getLocationButton.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.#latInput.value = position.coords.latitude;
          this.#lonInput.value = position.coords.longitude;
          getLocationButton.textContent = "Get My Location";
          getLocationButton.disabled = false;
        },
        (error) => {
          alert(`Error getting location: ${error.message}`);
          getLocationButton.textContent = "Get My Location";
          getLocationButton.disabled = false;
        }
      );
    });
  }

  #initFormSubmit() {
    this.#addStoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (this.#isSubmitting) return;

      const submitButton = document.getElementById("submit-button");
      const description = document.getElementById("description").value;
      const photoFile = this.#photoInput.files[0];

      if (!description || !photoFile) {
        alert("Please fill all required fields");
        return;
      }

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photoFile);

      if (
        this.#locationCheckbox.checked &&
        this.#latInput.value &&
        this.#lonInput.value
      ) {
        formData.append("lat", this.#latInput.value);
        formData.append("lon", this.#lonInput.value);
      }

      try {
        this.#isSubmitting = true;
        submitButton.textContent = "Submitting...";
        submitButton.disabled = true;

        if (AuthService.isLoggedIn()) {
          await StoryService.addStory(formData);
        } else {
          await StoryService.addStoryAsGuest(formData);
        }

        this.#showNotification(description);

        alert("Story added successfully!");
        window.location.hash = "#/";
      } catch (error) {
        alert(`Failed to add story: ${error.message}`);
      } finally {
        this.#isSubmitting = false;
        submitButton.textContent = "Submit Story";
        submitButton.disabled = false;
      }
    });
  }

  #showNotification(description) {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Story created successfully", {
        body: `You have created a new story with description: ${description.substring(
          0,
          50
        )}${description.length > 50 ? "..." : ""}`,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Story created successfully", {
            body: `You have created a new story with description: ${description.substring(
              0,
              50
            )}${description.length > 50 ? "..." : ""}`,
          });
        }
      });
    }
  }

  #initCameraCapture() {
    const openCameraButton = document.getElementById("open-camera");
    const closeCameraButton = document.getElementById("close-camera");
    const captureButton = document.getElementById("capture-photo");
    const cameraContainer = document.getElementById("camera-container");
    const videoElement = document.getElementById("camera-preview");

    let stream = null;

    openCameraButton.addEventListener("click", async () => {
      try {
        const constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (initialError) {
          console.log(
            "Initial camera access failed, trying fallback:",
            initialError
          );
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        videoElement.srcObject = stream;
        cameraContainer.style.display = "block";
      } catch (error) {
        console.error("Camera access error:", error);
        alert(
          `Error accessing camera: ${error.message}. Please check camera permissions in your browser settings.`
        );
      }
    });

    closeCameraButton.addEventListener("click", () => {
      this.#stopCameraStream(stream);
      cameraContainer.style.display = "none";
    });

    captureButton.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      this.#compressImage(dataUrl, "camera-capture.jpg").then(
        (compressedFile) => {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(compressedFile);

          this.#photoInput.files = dataTransfer.files;

          const changeEvent = new Event("change", { bubbles: true });
          this.#photoInput.dispatchEvent(changeEvent);

          this.#stopCameraStream(stream);
          cameraContainer.style.display = "none";
        }
      );
    });
  }

  #stopCameraStream(stream) {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  #initMapLocationSelector() {
    const selectOnMapButton = document.getElementById("select-on-map");
    const closeMapButton = document.getElementById("close-map");
    const mapContainer = document.getElementById("location-map-container");

    let map = null;
    let marker = null;

    if (!document.getElementById("leaflet-css")) {
      const leafletCSS = document.createElement("link");
      leafletCSS.id = "leaflet-css";
      leafletCSS.rel = "stylesheet";
      leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(leafletCSS);
    }

    selectOnMapButton.addEventListener("click", () => {
      mapContainer.style.display = "block";

      if (!map) {
        if (!window.L) {
          const leafletScript = document.createElement("script");
          leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          document.head.appendChild(leafletScript);

          leafletScript.onload = () => {
            const defaultLat = this.#latInput.value || -6.2088;
            const defaultLng = this.#lonInput.value || 106.8456;
            const result = this.#initializeMap(defaultLat, defaultLng);
            map = result.map;
            marker = result.marker;
          };
        } else {
          const defaultLat = this.#latInput.value || -6.2088;
          const defaultLng = this.#lonInput.value || 106.8456;
          const result = this.#initializeMap(defaultLat, defaultLng);
          map = result.map;
          marker = result.marker;
        }
      } else {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    });

    closeMapButton.addEventListener("click", () => {
      mapContainer.style.display = "none";
    });
  }

  #initializeMap(defaultLat, defaultLng) {
    let map = null;
    let marker = null;

    map = L.map("location-map").setView([defaultLat, defaultLng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    if (this.#latInput.value && this.#lonInput.value) {
      marker = L.marker([this.#latInput.value, this.#lonInput.value]).addTo(
        map
      );
    }

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;

      this.#latInput.value = lat;
      this.#lonInput.value = lng;

      if (marker) {
        marker.setLatLng([lat, lng]);
      } else {
        marker = L.marker([lat, lng]).addTo(map);
      }

      marker
        .bindPopup(
          `<b>Selected Location</b><br>Latitude: ${lat.toFixed(
            6
          )}<br>Longitude: ${lng.toFixed(6)}`
        )
        .openPopup();
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return { map, marker };
  }

  #compressImage(src, fileName) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], fileName, {
              type: "image/jpeg",
              lastModified: new Date().getTime(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.7
        );
      };
    });
  }
}
