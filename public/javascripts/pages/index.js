// define(['exports'], function(exports) {
  // var Index = function () {
    // function Index() {
      // this.loginButton()
      // // window.ZACH = new Kaleidoscope(true)
      // document.body.classList.add('loaded') 
    // }

    // loginButton() {
      // const button = document.querySelector('.login')
      // button.addEventListener('click', this.getAuthId)
    // }

    // getAuthId() {
      // console.log("LOGIN PRESS");
      // fetch('/auth')
        // .then((res) => res.json())
        // .then((res) => {
          // if (res.auth_id) {
            // window.location.href = `/login?auth_id=${res.auth_id}`
          // }
        // })
    // }
  // }
  // return Index;
// });
class Index {
  constructor() {
    this.loginButton()
    //window.ZACH = new Kaleidoscope(true)
    document.body.classList.add('loaded') 
  }

  loginButton() {
    const button = document.querySelector('.login')
    button.addEventListener('click', this.getAuthId)
  }

  getAuthId() {
    fetch('/auth')
      .then((res) => res.json())
      .then((res) => {
        if (res.auth_id) {
          window.location.href = `/login?auth_id=${res.auth_id}`
        }
      })
  }
}

export default Index

