use std::fmt::Display;
use serde::{Deserialize, Serialize};
use directories::ProjectDirs;
use std::fs::{create_dir_all, File};
use std::io::{Read, Write};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
enum HostProtocol {
  VNC,
  HTTP,
  HTTPS,
  SSH
}

impl Display for HostProtocol {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    let str = match self {
      HostProtocol::VNC => "VNC",
      HostProtocol::HTTP => "HTTP",
      HostProtocol::HTTPS => "HTTPS",
      HostProtocol::SSH => "SSH",
    }
      .to_string();
    write!(f, "{}", str)
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Host {
  pub id: u64,
  name: String,
  ip: String,
  protocol: HostProtocol,
  username: Option<String>,
  password: Option<String>,
}

pub fn get_data_file_path() -> PathBuf {
  let proj_dirs = ProjectDirs::from("com", "remotely", "app")
    .expect("Failed to get platform data dir");
  let data_dir = proj_dirs.data_dir();
  create_dir_all(data_dir).expect("Failed to create config dir");
  data_dir.join("hosts.json")
}

pub fn read_hosts() -> Vec<Host> {
  let path = get_data_file_path();
  if !path.exists() {
    return Vec::new();
  }

  let mut file = File::open(path).expect("Failed to open hosts file");
  let mut contents = String::new();
  file.read_to_string(&mut contents).expect("Failed to read hosts");
  serde_json::from_str(&contents).unwrap_or_else(|_| Vec::new())
}

pub fn write_hosts(hosts: &[Host]) {
  let path = get_data_file_path();
  let contents = serde_json::to_string_pretty(hosts).expect("Serialization failed");
  let mut file = File::create(path).expect("Failed to create hosts file");
  file.write_all(contents.as_bytes()).expect("Failed to write hosts");
}