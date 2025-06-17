const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const Store = require('electron-store').default;
const store = new Store();

let win;

function createMainWindow() {
    win = new BrowserWindow({
        width: 500,
        height: 500,
        transparent: true,
        frame: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            offscreen: false,
        },
        backgroundColor: '#00000000',
    });

    win.loadFile('index.html');
}

function createNameWindow() {
    const nameWin = new BrowserWindow({
        width: 300,
        height: 300,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    nameWin.loadFile('name.html');

    ipcMain.once('save-user-name', (_, name) => {
        store.set('name', name);
        nameWin.close();
        createMainWindow();
    });
}

// -----------------------------
// 🔁 상태 저장/불러오기
// -----------------------------
ipcMain.handle('get-user-name', () => {
    return store.get('name', null);
});

ipcMain.on('save-user-name', (_, name) => {
    store.set('name', name);
});

ipcMain.handle('get-hunger', () => {
    return store.get('hunger', 0);
});

ipcMain.handle('get-affection', () => {
    return store.get('affection', 0);
});

ipcMain.handle('get-playtime', () => {
    return store.get('playtimeSeconds', 0);
});

ipcMain.handle('get-growth-level', () => {
    return store.get('growthLevel', 1); // 기본 1단계
});

ipcMain.on('save-playtime', (_, seconds) => {
    store.set('playtimeSeconds', seconds);
});

ipcMain.on('save-growth-level', (_, level) => {
    store.set('growthLevel', level);
});

// ✅ 핵심: 한번에 상태 저장 (hunger, affection, growthLevel 포함)
ipcMain.on('save-status', (_, data) => {
    if (data.hunger !== undefined) {
        store.set('hunger', data.hunger);
    }
    if (data.affection !== undefined) {
        store.set('affection', data.affection);
    }
    if (data.growthLevel !== undefined) {
        store.set('growthLevel', data.growthLevel);
    }
});

// -----------------------------
// 창 생성 & 종료 처리
// -----------------------------
ipcMain.on('quit-app', () => {
    app.quit();
});

app.whenReady().then(() => {
    const name = store.get('name', null);
    if (name) {
        createMainWindow();
    } else {
        createNameWindow();
    }
});

// -----------------------------
// 창 관련 기능들
// -----------------------------
ipcMain.on('refresh-window', () => {
    if (win) {
        const bounds = win.getBounds();
        win.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height - 1 });
        win.setBounds(bounds);
    }
});

ipcMain.on('move-window', (_, pos) => {
    const [width, height] = win.getSize();
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
            click: () => event.sender.send('pet-action', 'feed'),
        },
        {
            label: '재우기',
            click: () => event.sender.send('pet-action', 'sleep'),
        },
        {
            label: '상태보기',
            click: () => event.sender.send('pet-action', 'status'),
        },
        {
            label: '개인기',
            click: () => event.sender.send('pet-action', 'trick'),
        },
        {
            label: '놀기',
            click: () => event.sender.send('pet-action', 'play'),
        },
    ]);
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});
