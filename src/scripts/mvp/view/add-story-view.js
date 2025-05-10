export default class AddStoryView {
  #presenter = null;
  #addStoryForm = null;
  #photoPreview = null;
  #photoInput = null;
  #locationCheckbox = null;
  #locationFields = null;
  #latInput = null;
  #lonInput = null;
  #submitButton = null;
  #cameraStream = null;

  setPresenter(presenter) {
    this.#presenter = presenter;
  }

  render() {
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

  afterRender() {
    this.#addStoryForm = document.getElementById("add-story-form");
    this.#photoPreview = document.getElementById("photo-preview");
    this.#photoInput = document.getElementById("photo");
    this.#locationCheckbox = document.getElementById("include-location");
    this.#locationFields = document.getElementById("location-fields");
    this.#latInput = document.getElementById("latitude");
    this.#lonInput = document.getElementById("longitude");
    this.#submitButton = document.getElementById("submit-button");

    this.#initPhotoPreview();
    this.#initLocationToggle();
    this.#initGetLocationButton();
    this.#initMapLocationSelector();
    this.#initCameraCapture();
    this.#initFormSubmit();
  }

  #initFormSubmit() {
    this.#addStoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const description = document.getElementById("description").value;
      const photoFile = this.#photoInput.files[0];

      if (!description || !photoFile) {
        this.showError("Please fill all required fields");
        return;
      }

      const storyData = {
        description,
        photoFile
      };

      if (this.#locationCheckbox.checked && this.#latInput.value && this.#lonInput.value) {
        storyData.lat = this.#latInput.value;
        storyData.lon = this.#lonInput.value;
      }

      this.showSubmitLoading();
      await this.#presenter.submitStory(storyData);
    });
  }

  #initPhotoPreview() {
    this.#photoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.#photoPreview.innerHTML = `
            <img src="${e.target.result}" alt="Selected photo preview">
          `;
        };
        reader.readAsDataURL(file);
      } else {
        this.#photoPreview.innerHTML = `<p>No photo selected</p>`;
      }
    });
  }

  #initLocationToggle() {
    this.#locationCheckbox.addEventListener("change", () => {
      if (this.#locationCheckbox.checked) {
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
        this.showError("Geolocation is not supported by your browser");
        return;
      }

      getLocationButton.textContent = "Getting location...";
      getLocationButton.disabled = true;

      this.#presenter.getCurrentLocation()
        .then(position => {
          this.#latInput.value = position.latitude;
          this.#lonInput.value = position.longitude;
          getLocationButton.textContent = "Get My Location";
          getLocationButton.disabled = false;
        })
        .catch(error => {
          this.showError(`Error getting location: ${error.message}`);
          getLocationButton.textContent = "Get My Location";
          getLocationButton.disabled = false;
        });
    });
  }

  #initMapLocationSelector() {
    const selectOnMapButton = document.getElementById("select-on-map");
    const mapContainer = document.getElementById("location-map-container");
    const closeMapButton = document.getElementById("close-map");
    const mapElement = document.getElementById("location-map");

    selectOnMapButton.addEventListener("click", async () => {
      mapContainer.style.display = "block";
      
      // Initialize map - this would be handled by the presenter
      await this.#presenter.initializeMap(mapElement, (lat, lon) => {
        this.#latInput.value = lat;
        this.#lonInput.value = lon;
      });
    });

    closeMapButton.addEventListener("click", () => {
      mapContainer.style.display = "none";
    });
  }

  #initCameraCapture() {
    const openCameraButton = document.getElementById("open-camera");
    const cameraContainer = document.getElementById("camera-container");
    const cameraPreview = document.getElementById("camera-preview");
    const capturePhotoButton = document.getElementById("capture-photo");
    const closeCameraButton = document.getElementById("close-camera");

    openCameraButton.addEventListener("click", async () => {
      try {
        this.#cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        
        cameraPreview.srcObject = this.#cameraStream;
        cameraContainer.style.display = "block";
      } catch (error) {
        this.showError(`Error accessing camera: ${error.message}`);
      }
    });

    capturePhotoButton.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = cameraPreview.videoWidth;
      canvas.height = cameraPreview.videoHeight;
      
      const context = canvas.getContext("2d");
      context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(blob => {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        
        // Create a DataTransfer object to set the files property
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        this.#photoInput.files = dataTransfer.files;
        
        // Trigger change event to update preview
        this.#photoInput.dispatchEvent(new Event("change"));
        
        // Close camera
        this.#stopCameraStream();
        cameraContainer.style.display = "none";
      }, "image/jpeg");
    });

    closeCameraButton.addEventListener("click", () => {
      this.#stopCameraStream();
      cameraContainer.style.display = "none";
    });
  }

  #stopCameraStream() {
    if (this.#cameraStream) {
      this.#cameraStream.getTracks().forEach(track => {
        track.stop();
      });
      this.#cameraStream = null;
    }
  }

  showSubmitLoading() {
    this.#submitButton.textContent = "Submitting...";
    this.#submitButton.disabled = true;
  }

  hideSubmitLoading() {
    this.#submitButton.textContent = "Submit Story";
    this.#submitButton.disabled = false;
  }

  showSuccess(message) {
    alert(message || "Story added successfully!");
    window.location.hash = "#/";
  }

  showError(message) {
    alert(message || "Failed to add story");
  }
}