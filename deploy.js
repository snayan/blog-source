const ghpages = require("gh-pages")

ghpages.publish(
  "public",
  {
    branch: "master",
    repo: "https://github.com/snayan/snayan.github.io.git",
    message: "deploy:" + new Date().toLocaleString(),
    user: {
      name: "snayan",
      email: "snayan@sina.com",
    },
  },
  error => {
    if (error) {
      console.log(error)
      process.exitCode(0)
    }
  }
)
