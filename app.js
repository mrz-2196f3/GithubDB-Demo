const GITHUB_TOKEN = 'PUT YOUR GITHUB PAT HERE'; // Personal Access Token or PAT generated via Github
// NOTE: Allow Read And Write on your PAT Permissions 'Contents' so this program will work/run properly.
const REPO = 'mrz-2196f3/GithubDB-Demo'; // Change your github repo here. 'username/repo'
const API = 'https://api.github.com/repos/' + REPO + '/contents/'; // DO NOT CHANGE/MODIFY

let currentUser = null;

async function fetchFile(file) {
  const res = await fetch(API + file, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  return { data: JSON.parse(content), sha: data.sha };
}

async function updateFile(file, newData, message, sha) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
  const res = await fetch(API + file, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    },
    body: JSON.stringify({
      message: message,
      content: encoded,
      sha: sha
    })
  });
  return res.json();
}

// Authentication includes Register and Login
async function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const usersFile = await fetchFile('users.json');
  const users = usersFile.data;

  if (users.find(u => u.username === username)) {
    alert('Username already exists.');
    return;
  }

  users.push({ username, password });
  await updateFile('users.json', users, 'Register new user', usersFile.sha);
  alert('Registered! You can now log in.');
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const usersFile = await fetchFile('users.json');
  const users = usersFile.data;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = username;
    document.getElementById('auth').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('userDisplay').textContent = username;
    loadFeed();
  } else {
    alert('Invalid credentials.');
  }
}

function logout() {
  currentUser = null;
  document.getElementById('auth').style.display = 'block';
  document.getElementById('app').style.display = 'none';
}

// Post
async function submitPost() {
  const text = document.getElementById('postText').value;
  if (!text) return;

  const postsFile = await fetchFile('posts.json');
  const posts = postsFile.data;

  posts.push({
    id: Date.now(),
    user: currentUser,
    text,
    likes: [],
    comments: [],
    time: new Date().toISOString()
  });

  await updateFile('posts.json', posts, 'New post', postsFile.sha);
  document.getElementById('postText').value = '';
  loadFeed();
}

// Feed
async function loadFeed() {
  const postsFile = await fetchFile('posts.json');
  const posts = postsFile.data;
  const container = document.getElementById('feed');
  container.innerHTML = '';

  posts.reverse().forEach(p => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
      <b>${p.user}</b>: ${p.text}<br>
      <small>${new Date(p.time).toLocaleString()}</small><br>
      <button onclick="likePost(${p.id})">❤️ ${p.likes.length}</button>
      <div>
        ${p.comments.map(c => `<p><b>${c.user}:</b> ${c.text}</p>`).join('')}
        <input onkeypress="if(event.key==='Enter'){comment(${p.id}, this.value); this.value=''}" placeholder="Comment...">
      </div>
    `;
    container.appendChild(div);
  });
}

// User Interactions (Comment and Like)
async function likePost(postId) {
  const postsFile = await fetchFile('posts.json');
  const posts = postsFile.data;
  const post = posts.find(p => p.id === postId);
  if (!post.likes.includes(currentUser)) post.likes.push(currentUser);
  await updateFile('posts.json', posts, 'Like post', postsFile.sha);
  loadFeed();
}

async function comment(postId, text) {
  const postsFile = await fetchFile('posts.json');
  const posts = postsFile.data;
  const post = posts.find(p => p.id === postId);
  post.comments.push({ user: currentUser, text });
  await updateFile('posts.json', posts, 'New comment', postsFile.sha);
  loadFeed();
}
