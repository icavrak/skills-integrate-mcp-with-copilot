
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const categoryFilter = document.getElementById("category-filter");
  const sortFilter = document.getElementById("sort-filter");
  const searchFilter = document.getElementById("search-filter");

  let allActivities = {};

  // Function to render activities with filters
  function renderActivities() {
    // Get filter values
    const category = categoryFilter ? categoryFilter.value : "";
    const sortBy = sortFilter ? sortFilter.value : "name";
    const search = searchFilter ? searchFilter.value.trim().toLowerCase() : "";

    // Convert activities to array for filtering/sorting
    let filtered = Object.entries(allActivities);

    // Filter by category
    if (category) {
      filtered = filtered.filter(([_, details]) => details.category === category);
    }

    // Filter by search
    if (search) {
      filtered = filtered.filter(([name, details]) =>
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search) ||
        (details.category && details.category.toLowerCase().includes(search))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortBy === "date") {
        return new Date(a[1].date) - new Date(b[1].date);
      }
      return 0;
    });

    // Clear list and dropdown
    activitiesList.innerHTML = "";
  // No global activity select dropdown

    // Render filtered activities
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p class="activity-desc">${details.description}</p>
        <p><strong>Category:</strong> ${details.category || ""}</p>
        <p><strong>Date:</strong> ${details.date || ""}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <button class="register-btn" data-activity="${name}">Register Student</button>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Make the whole card clickable to select activity
      activityCard.style.cursor = "pointer";
      // No card click-to-select logic needed
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    // Add event listeners to register buttons
    document.querySelectorAll(".register-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        e.stopPropagation();
        const activity = button.getAttribute("data-activity");
        let email = prompt("Enter student email to register:");
        if (!email) return;
        email = email.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          alert("Please enter a valid email address.");
          return;
        }
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, { method: "POST" });
          const result = await response.json();
          if (response.ok) {
            alert(result.message);
            fetchActivities();
          } else {
            alert(result.detail || "An error occurred");
          }
        } catch (error) {
          alert("Failed to sign up. Please try again.");
        }
      });
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchActivities();
      } else {
        alert(result.detail || "An error occurred");
      }
    } catch (error) {
      alert("Failed to unregister. Please try again.");
      console.error("Error unregistering:", error);
    }
  }

  // No global signup form submission logic needed

  // Add filter event listeners
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortFilter) sortFilter.addEventListener("change", renderActivities);
  if (searchFilter) searchFilter.addEventListener("input", renderActivities);

  // Initialize app
  fetchActivities();
});
