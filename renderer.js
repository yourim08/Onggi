const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', async () => {
    const pet = document.getElementById('pet');
    const statusWindow = document.getElementById('status-window');
    const closeBtn = document.getElementById('close-status');
    const playtimeText = document.getElementById('playtime-text');
    const hungerBar = document.getElementById('hunger');
    const affectionBar = document.getElementById('affection');
    const growthText = document.getElementById('growth-text'); // 성장 단계 표시 요소

    // ▶️ 사용자 이름 처리
    let userName = await ipcRenderer.invoke('get-user-name');

    if (!userName) {
        const input = prompt('이름을 입력하세요 (처음 실행 시 1회만 입력):');
        if (input && input.trim()) {
            userName = input.trim();
            ipcRenderer.send('save-user-name', userName);
            alert(`반가워요, ${userName}님!`);
        } else {
            alert('이름을 입력해야 앱을 사용할 수 있어요.');
            window.close(); // 강제 종료
        }
    }

    // ▶️ 상태 관련 초기값 불러오기
    let hunger = await ipcRenderer.invoke('get-hunger'); // 호감도
    let affection = await ipcRenderer.invoke('get-affection'); // main에서 불러오게 해야 함
    let isBusy = false;
    if (hungerBar) {
        hungerBar.value = hunger;
    }
    if (affectionBar) {
        affectionBar.value = affection;
    }

    // ▶️ 플레이타임 관련
    let playTimeSeconds = await ipcRenderer.invoke('get-playtime'); // 플레이타임(초)

    function formatPlayTime(seconds) {
        const day = Math.floor(seconds / (24 * 3600));
        seconds %= 24 * 3600;
        const hour = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minute = Math.floor(seconds / 60);
        return `${day}일 ${hour}시 ${minute}분`;
    }

    // ▶️ 성장 단계 변수 초기값
    let growthLevel = await ipcRenderer.invoke('get-growth-level');

    // ▶️ 성장 단계 업데이트 함수
    function updateGrowthLevel(level) {
        growthLevel = level;
        if (growthText) {
            growthText.textContent = `성장도 : ${growthLevel}단계`;
        }

        if (growthLevel === 2) {
            pet.src = 'images/main_level2.gif';
        } else if (growthLevel === 1) {
            pet.src = 'images/main_level1.gif';
        }

        saveStatus(); // ✅ 성장단계도 저장
    }



    // ▶️ 성장 단계 조건 확인 함수 (2시간 이상 + 호감도 100)
    function checkGrowthLevel() {
        // 1단계 → 2단계 조건
        if (growthLevel === 1 && playTimeSeconds >= 7200 && affection === 100) {
            updateGrowthLevel(2);
            affection = 0;
            if (affectionBar) {
                affectionBar.value = affection;
                alert('축하합니다! 성장 2단계에 도달했어요! 호감도가 초기화됩니다.');
            }
            saveStatus();
        }
    }


    // ⏱️ 1초마다 시간 증가 및 표시 + 저장 + 성장 단계 체크
    setInterval(() => {
        playTimeSeconds++;
        if (playtimeText) {
            playtimeText.textContent = formatPlayTime(playTimeSeconds);
        }

        ipcRenderer.send('save-playtime', playTimeSeconds);

        checkGrowthLevel();  // 성장 단계 체크
    }, 1000);



    // 📦 상태 저장 함수
    function saveStatus() {
        ipcRenderer.send('save-status', {
            hunger,
            affection,
            growthLevel // ✅ 이 줄이 반드시 필요
        });
    }

    // 🐾 드래그 관련
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    pet.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        offsetX = e.offsetX;
        offsetY = e.offsetY;
        isDragging = true;

        const onMouseMove = (moveEvent) => {
            if (!isDragging) return;

            ipcRenderer.send('move-window', {
                x: moveEvent.screenX - offsetX,
                y: moveEvent.screenY - offsetY,
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

    // 🧾 우클릭 메뉴
    pet.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        ipcRenderer.send('show-context-menu');
    });

    // 🛠️ 상태 보기 등 IPC 처리
    ipcRenderer.on('pet-action', (_, action) => {
        switch (action) {
            case 'feed':
                if (isBusy) return;
                isBusy = true;

                // 포만감 증가
                hunger = Math.min(hunger + 10, 100);
                if (hungerBar) {
                    hungerBar.value = hunger;
                }

                saveStatus();

                checkGrowthLevel();  // 포만감 변경 후 성장 단계 체크

                if (growthLevel === 2) {
                    pet.src = 'images/feed_level2.gif'; // 2단계 놀기 애니메이션
                } else {
                    pet.src = 'images/feed_level1.gif'; // 1단계 놀기 애니메이션
                }

                setTimeout(() => {
                    if (growthLevel === 2) {
                        pet.src = 'images/main_level2.gif';  // 2단계 기본 이미지
                    } else {
                        pet.src = 'images/main_level1.gif'; // 1단계 기본 이미지
                    }
                    isBusy = false;
                }, 3000);
                break;

            case 'sleep':
                if (isBusy) return;
                isBusy = true;
                if (growthLevel === 2) {
                    pet.src = 'images/sleep_level2.gif'; // 2단계 놀기 애니메이션
                } else {
                    pet.src = 'images/sleep_level1.gif';
                }
                setTimeout(() => {
                    if (growthLevel === 2) {
                        pet.src = 'images/main_level2.gif';
                        ipcRenderer.send('quit-app');// 2단계 기본 이미지
                    } else {
                        pet.src = 'images/main_level1.gif';
                        ipcRenderer.send('quit-app');// 1단계 기본 이미지
                    }
                    isBusy = false;
                }, 3000);
                break;


            case 'status':
                statusWindow.classList.remove('hidden');
                ipcRenderer.invoke('get-user-name').then((userName) => {
                    const nameDisplay = document.getElementById('user-name-display');
                    if (nameDisplay) {
                        nameDisplay.textContent = `${userName}의 상태`;
                    }

                    // 강제 리렌더링 트리거
                    void statusWindow.offsetHeight;

                    ipcRenderer.send('refresh-window');
                });

                break;

            case 'trick':
                if (isBusy) return;
                isBusy = true;
                if (hunger === 0) {
                    alert('포만감이 0입니다! 배가 고파서 개인기를 할 수 없어요.');
                    isBusy = false;
                    return;
                }

                affection = Math.min(affection + 5, 100);
                hunger = Math.max(hunger - 3, 0);

                if (hungerBar) hungerBar.value = hunger;
                if (affectionBar) affectionBar.value = affection;

                saveStatus();
                checkGrowthLevel();

                if (growthLevel === 2) {
                    pet.src = 'images/trick_level2.png'; // 2단계 놀기 애니메이션
                } else {
                    pet.src = 'images/trick_level1.png'; // 1단계 놀기 애니메이션
                }

                setTimeout(() => {
                    if (growthLevel === 2) {
                        pet.src = 'images/main_level2.gif';  // 2단계 기본 이미지
                    } else {
                        pet.src = 'images/main_level1.gif'; // 1단계 기본 이미지
                    }
                    isBusy = false;
                }, 3000);
                break;


            case 'play':
                if (isBusy) return;
                isBusy = true;
                if (hunger === 0) {
                    alert('포만감이 0입니다! 배가 고파서 놀기를 할 수 없어요.');
                    isBusy = false;
                    return;
                } else if (hunger-6 < 0) {
                    alert('포만감이 0미만으로 떨어져서 놀기를 할 수 없어요.');
                    isBusy = false;
                    return;
                }
                // 호감도 증가, 포만감 감소
                affection = Math.min(affection + 7, 100);
                hunger = Math.max(hunger - 6, 0);

                if (hungerBar) {
                    hungerBar.value = hunger;
                }

                if (affectionBar) {
                    affectionBar.value = affection;
                }

                saveStatus();
                checkGrowthLevel(); // 호감도 바뀌었으므로 성장단계 재확인

                // 애니메이션
                if (growthLevel === 2) {
                    pet.src = 'images/play_level2.gif'; // 2단계 놀기 애니메이션
                } else {
                    pet.src = "images/play_level1.gif"; // 1단계 놀기 애니메이션
                }
                setTimeout(() => {
                    if (growthLevel === 2) {
                        pet.src = 'images/main_level2.gif';  // 2단계 기본 이미지
                    } else {
                        pet.src = 'images/main_level1.gif'; // 1단계 기본 이미지
                    }
                    isBusy = false;
                }, 3000);
                break;

        }
    });

    closeBtn.addEventListener('click', () => {
        statusWindow.classList.add('hidden');
    });

    // 초기 성장 단계 표시 (처음 앱 켰을 때 상태 반영)
    updateGrowthLevel(growthLevel);
    checkGrowthLevel();
});
