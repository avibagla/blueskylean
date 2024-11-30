const JETSTREAM_URL = "wss://jetstream1.us-east.bsky.network/subscribe";

let leftCount = 0;
let rightCount = 0;

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
