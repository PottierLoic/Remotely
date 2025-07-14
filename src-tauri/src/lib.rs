mod host;
use host::Host;

#[tauri::command]
fn get_host_list() -> Vec<Host> {
    host::read_hosts()
}

#[tauri::command]
fn add_host(new_host: Host) {
    let mut hosts = host::read_hosts();
    hosts.push(new_host);
    host::write_hosts(&hosts);
}

#[tauri::command]
fn delete_host(id: u64) {
    let mut hosts = host::read_hosts();
    hosts.retain(|h| h.id != id);
    host::write_hosts(&hosts);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_host_list, add_host, delete_host])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
