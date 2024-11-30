const JETSTREAM_URL = "wss://jetstream1.us-east.bsky.network/subscribe";

let leftCount = 0;
let rightCount = 0;



function updateSeesaw() {
  const total = leftCount + rightCount;
  if (total === 0) return; // No posts, no tilt

  const leftPercent = (leftCount / total) * 100; // Calculate left percentage
  const tilt = (leftPercent - 50) * .45; // Convert percentage difference to tilt angle

  const seesaw = document.getElementById("seesaw");
  seesaw.style.transform = `rotate(${-tilt}deg)`; // Apply tilt angle
}

// Update the weights above the seesaw based on the balance
function updateWeights() {
  const total = leftCount + rightCount;
  if (total === 0) return; // No posts, no weight movement

  const leftWeight = document.getElementById("left-weight");
  const rightWeight = document.getElementById("right-weight");

  const leftPercent = (leftCount / total) * 100; // Calculate left percentage
  const leftBottom = Math.max(0, (50 - leftPercent) * 2); // Adjust left weight height
  const rightBottom = Math.max(0, (leftPercent - 50) * 2); // Adjust right weight height

  leftWeight.style.bottom = `${leftBottom}%`;
  rightWeight.style.bottom = `${rightBottom}%`;
}

function updateWeightCounts() {
  const leftWeight = document.getElementById("left-weight");
  const rightWeight = document.getElementById("right-weight");

  leftWeight.textContent = leftCount; // Set the count for left weight
  rightWeight.textContent = rightCount; // Set the count for right weight
}

// Update the bar graph
function updateBarGraph() {
  const total = leftCount + rightCount;
  const leftPercent = total === 0 ? 0 : (leftCount / total) * 100;
  const rightPercent = total === 0 ? 0 : (rightCount / total) * 100;

  const leftBar = document.getElementById("left-bar");
  const rightBar = document.getElementById("right-bar");
  const leftPercentageText = document.getElementById("left-percentage");
  const rightPercentageText = document.getElementById("right-percentage");

  leftBar.style.width = `${leftPercent}%`;
  rightBar.style.width = `${rightPercent}%`;

  leftPercentageText.textContent = `${Math.round(leftPercent)}%`;
  rightPercentageText.textContent = `${Math.round(rightPercent)}%`;
}

// Add a post to the correct column
function addPost(content, side, createdAt) {
  const column = side === "left" ? "left-posts" : "right-posts";
  const postsContainer = document.getElementById(column);

  const postElement = document.createElement("div");
  postElement.className = "post";

  postElement.innerHTML = `
    <div class="meta">${new Date(createdAt).toLocaleString()}</div>
    <div class="content">${content}</div>
  `;

  postsContainer.prepend(postElement);
}

// Process post events and count "left" and "right"
function processPostEvent(record) {
  const postText = record?.text || "";
  const createdAt = record?.createdAt || new Date().toISOString();

  // Highlight left and right keywords
  const styledText = postText
    .replace(/\bleft\b/gi, '<span class="left-highlight">left</span>')
    .replace(/\bright\b/gi, '<span class="right-highlight">right</span>');

  // Check for standalone mentions of "left" and "right"
  const hasLeft = /\bleft\b/gi.test(postText);
  const hasRight = /\bright\b/gi.test(postText);

  if (hasLeft) {
    leftCount++;
    addPost(styledText, "left", createdAt);
  }

  if (hasRight) {
    rightCount++;
    addPost(styledText, "right", createdAt);
  }

  // Update the bar graph
  updateBarGraph();
  updateSeesaw();
  updateWeightsCounts();
}

// Connect to the WebSocket
function connectToJetstream() {
  const socket = new WebSocket(JETSTREAM_URL);

  socket.onopen = () => {
    console.log("Connected to Jetstream");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data?.commit?.collection === "app.bsky.feed.post") {
        const record = data.commit.record;
        processPostEvent(record);
      }
    } catch (error) {
      console.error("Error processing Jetstream message:", error);
    }
  };

  socket.onerror = (event) => {
    console.error("WebSocket Error:", event);
  };

  socket.onclose = () => {
    console.log("Connection closed. Reconnecting...");
    setTimeout(connectToJetstream, 1000);
  };
}

// Start the WebSocket connection
connectToJetstream();
