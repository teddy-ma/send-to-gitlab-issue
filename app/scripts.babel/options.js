var options_host = localStorage.options_host
document.getElementById('options_host').value = options_host;
var options_project_id = localStorage.options_project_id
document.getElementById('options_project_id').value = options_project_id;
var options_token = localStorage.options_token
document.getElementById('options_token').value = options_token;

document.getElementById('options_save').onclick = function() {
  localStorage.options_host = document.getElementById('options_host').value;
  localStorage.options_project_id = document.getElementById('options_project_id').value;
  localStorage.options_token = document.getElementById('options_token').value;
  document.getElementById('flash').innerHTML = '保存成功';
}
