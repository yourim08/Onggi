const { app, BrowserWindow, Menu, ipcMain } = require('electron');

let win;

app.whenReady().then(() => {
    win = new BrowserWindow({
        width: 300,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        backgroundColor: '#00000000',
    });

    win.loadFile('index.html');
});

ipcMain.on('move-window', (_, pos) => {
    const [width, height] = win.getSize(); // 창 크기 유지
    win.setBounds({
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        width,
        height,
    });
});

ipcMain.on('show-context-menu', (event) => {
    const menu = Menu.buildFromTemplate([
        {
            label: '밥주기',
            click: () => {
                event.sender.send('pet-action', 'feed');
            }
        },
        {
            label: '재우기',
            click: () => {
                app.quit();
            }
        },
        {
            label: '상태보기',
            click: () => {
                event.sender.send('pet-action', 'status');
            }
        },
        {
            label: '놀아주기',
            submenu: [
                {
                    label: '쓰다듬기',
                    click: () => {
                        event.sender.send('pet-action', 'petting');
                    }
                },
                {
                    label: '개인기',
                    click: () => {
                        event.sender.send('pet-action', 'trick');
                    }
                },
                {
                    label: '터그놀이',
                    click: () => {
                        event.sender.send('pet-action', 'tug');
                    }
                },
                {
                    label: '공놀이',
                    click: () => {
                        event.sender.send('pet-action', 'ball');
                    }
                }
            ]
        }
    ]);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

