const socket = io();

// Extract Google user details with safety fallbacks
const username = typeof currentUser !== 'undefined' && currentUser ? currentUser.displayName : "Anonymous";
const avatar = (typeof currentUser !== 'undefined' && currentUser && currentUser.photos && currentUser.photos.length > 0) 
  ? currentUser.photos[0].value 
  : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      socket.emit("send-location", { latitude, longitude, username, avatar });
    },
    (error) => {
      console.error("Error getting location:", error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
} else {
  console.log("Geolocation is not supported by this browser.");
}

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.codebysde.in/'>by CodeBySDE</a>"
}).addTo(map);

const markers = {};

function getColorFromId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return colors[Math.abs(hash) % colors.length];
}

function adjustCoordinatesIfOverlap(latitude, longitude, id) {
  let adjustedLat = latitude;
  let adjustedLng = longitude;
  
  for (const key in markers) {
    if (key !== id) {
      const otherLatLng = markers[key].getLatLng();
      const distance = map.distance([adjustedLat, adjustedLng], [otherLatLng.lat, otherLatLng.lng]);
      
      // If markers are closer than 10 meters, add a small offset to separate them
      if (distance < 10) {
        adjustedLat += (Math.random() - 0.5) * 0.00015;
        adjustedLng += (Math.random() - 0.5) * 0.00015;
      }
    }
  }
  return [adjustedLat, adjustedLng];
}

socket.on("location-update", (data) => {
  const { id, latitude, longitude, username, avatar } = data;
  
  const [adjustedLat, adjustedLng] = adjustCoordinatesIfOverlap(latitude, longitude, id);
  
  // Center map on the current user's location only
  if (id === socket.id) {
    map.setView([adjustedLat, adjustedLng]);
  }
  
  const isCurrentUser = (id === socket.id);
  const pinColor = getColorFromId(id);
  const pinIcon = L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="custom-pin" style="background-color: ${pinColor}; border-color: ${pinColor};">
        <img src="${avatar}" class="pin-avatar" />
        ${isCurrentUser ? '<div class="pulse-ring"></div>' : ''}
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 46],
    popupAnchor: [0, -46]
  });
  
  const popupContent = `
    <div class="user-popup">
      <span class="user-name">${username}</span>
    </div>
  `;
  
  if (markers[id]) {
    markers[id].setLatLng([adjustedLat, adjustedLng]);
    markers[id].setIcon(pinIcon);
    markers[id].setPopupContent(popupContent);
  } else {
    const marker = L.marker([adjustedLat, adjustedLng], { icon: pinIcon }).addTo(map)
      .bindPopup(popupContent);
      
    marker.on("click", (e) => {
      map.setView(e.target.getLatLng(), 19);
    });
    
    markers[id] = marker;
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});