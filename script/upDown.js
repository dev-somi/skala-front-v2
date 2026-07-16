// 7. JavaScript 기초 과제 - Up-Down 숫자 맞추기
// 원래 요구사항은 prompt()/alert()로 입출력하지만, 이 페이지에서는
// 같은 게임 로직(난수 생성, 시도 횟수 카운트)을 다이얼로그 UI로 대체해 보여준다.
(function () {
    var computerNum;
    var attempts;

    var dialog = document.getElementById('updown-dialog');
    var trigger = document.getElementById('updown-trigger');
    var closeBtn = dialog.querySelector('.dialog-close');
    var guessInput = document.getElementById('updown-input');
    var guessBtn = document.getElementById('updown-guess-btn');
    var resetBtn = document.getElementById('updown-reset-btn');
    var feedback = document.getElementById('updown-feedback');

    function startNewGame() {
        computerNum = Math.floor(Math.random() * 50) + 1;
        attempts = 0;

        guessInput.value = '';
        guessInput.disabled = false;
        guessBtn.disabled = false;
        guessInput.focus();

        feedback.textContent = '';
        feedback.className = '';
    }

    function checkGuess() {
        var guess = Number(guessInput.value);

        if (!guessInput.value || guess < 1 || guess > 50) {
            feedback.className = 'is-hint';
            feedback.textContent = '1부터 50 사이의 숫자를 입력해주세요.';
            return;
        }

        attempts++;

        if (guess > computerNum) {
            feedback.className = 'is-hint';
            feedback.textContent = 'Down! (' + attempts + '번째 시도)';
        } else if (guess < computerNum) {
            feedback.className = 'is-hint';
            feedback.textContent = 'Up! (' + attempts + '번째 시도)';
        } else {
            feedback.className = 'is-success';
            feedback.textContent = '축하합니다! ' + attempts + '번 만에 맞추셨습니다.';
            guessInput.disabled = true;
            guessBtn.disabled = true;
        }
    }

    trigger.addEventListener('click', function () {
        startNewGame();
        dialog.showModal();
    });

    closeBtn.addEventListener('click', function () {
        dialog.close();
    });

    dialog.addEventListener('click', function (event) {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    guessBtn.addEventListener('click', checkGuess);

    guessInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            checkGuess();
        }
    });

    resetBtn.addEventListener('click', startNewGame);
})();
