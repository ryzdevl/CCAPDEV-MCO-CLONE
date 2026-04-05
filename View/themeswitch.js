let lightmode = localStorage.getItem('lightmode'); //checks the site's current state if its in light mode or not
const themeswitch = document.getElementById('theme-switch');

const enableLightmode = () => {
    document.body.classList.add('lightmode');
    localStorage.setItem('lightmode', 'active');
    document.querySelector('#theme-switch .themeswitch-text').textContent = 'switch to dark';
} 

const disableLightmode = () => {
    document.body.classList.remove('lightmode');
    localStorage.setItem('lightmode', null);
    document.querySelector('#theme-switch .themeswitch-text').textContent = 'switch to light';
}

if(lightmode === 'active'){
    enableLightmode();
}

themeswitch.addEventListener("click", () => {
    lightmode = localStorage.getItem('lightmode')
    
    if(lightmode !== 'active'){
        enableLightmode();
    }
    else {
        disableLightmode();
    }
})

