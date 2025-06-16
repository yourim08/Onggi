const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const pet = document.getElementById('pet');
    const statusWindow = document.getElementById('status-window');
    const closeStatusButton = document.getElementById('close-status');

    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    // 드래그
    pet.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        isDragging = true;

        const onMouseMove = (e) => {
            if (!isDragging) return;
            ipcRenderer.send('move-window', {
                x: e.screenX - offsetX,
                y: e.screenY - offsetY,
            });
        };

        const onMouseUp = () => {
            isDragging = false;
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    pet.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        ipcRenderer.send('show-context-menu');
    });

    ipcRenderer.on('pet-action', (_, action) => {
        if (action === 'feed') {
            changePetImageTemporarily('images/cat_eat.gif', 2000);
        } else if (action === 'sleep') {
            changePetImageTemporarily('images/cat_sleep.gif', 3000);
        } else if (action === 'status') {
            showStatusWindow();
        }
    });

    function changePetImageTemporarily(src, duration = 2000) {
        pet.src = src;
        setTimeout(() => {
            pet.src = 'images/cat_sit.gif';
        }, duration);
    }

    function showStatusWindow() {
        // 상태 값을 랜덤 또는 저장된 값으로 변경 가능
        document.getElementById('hunger').value = 70;
        document.getElementById('affection').value = 85;
        document.getElementById('growth').value = 40;
        document.getElementById('playtime').value = 55;

        statusWindow.classList.remove('hidden');
    }

    closeStatusButton.addEventListener('click', () => {
        statusWindow.classList.add('hidden');
    });

    ipcRenderer.on('pet-action', (_, action) => {
        const pet = document.getElementById('pet');
        const statusWindow = document.getElementById('status-window');

        switch (action) {
            case 'feed':
                pet.src = 'images/cat_eat.gif';
                setTimeout(() => { pet.src = 'images/cat_sit.gif'; }, 2000);
                break;

            case 'sleep':
                pet.src = 'images/cat_sleep.gif';
                setTimeout(() => { pet.src = 'images/cat_sit.gif'; }, 3000);
                break;

            case 'status':
                // 상태창 표시/숨김 토글
                statusWindow.style.display = (statusWindow.style.display === 'none' || statusWindow.style.display === '')
                    ? 'block' : 'none';
                break;
        }
    });

});
