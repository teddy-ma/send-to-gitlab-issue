chrome.tabs.query({
  active: true,
  currentWindow: true
}, (tabs) => {
  document.getElementById('popup_title').value = tabs[0].title;
  document.getElementById('popup_url').value = tabs[0].url;
});

if(
    (localStorage.options_host == 'undefined') ||
    (localStorage.options_project_id == 'undefined') ||
    (localStorage.options_token == 'undefined')
  ){
    document.getElementById('flash').innerHTML = '请先配置 gitlab 参数';
    document.getElementById('popup_button').style='display: none';
}else {

}

document.getElementById('popup_button').addEventListener('click', function() {
  createGitlabIssue(localStorage.options_project_id,
    document.getElementById('popup_title').value,
    document.getElementById('popup_url').value)
});

function httpRequest(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback('ok');
    }
  }
  xhr.onerror = function() {
    callback('error');
  }
  xhr.send();
}

function createGitlabIssue(project_id, title, content) {
  httpRequest(`${localStorage.options_host}/api/v3/projects/${project_id}/issues?title=${title}&description=${content}&private_token=${localStorage.options_token}`, (status) => {
    document.getElementById('flash').innerHTML = status;
  });
}
