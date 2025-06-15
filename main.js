const { app, BrowserWindow } = require('electron');

function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // 보안상 권장되지는 않음
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// macOS 용 윈도우 재생성 처리
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 앱 종료 처리
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
