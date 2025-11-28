target "www" {
  context    = "."
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = [
    "ghcr.io/tigrisdata-community/pastebin:latest",
  ]
  push = true
}

group "default" {
  targets = ["www"]
}
