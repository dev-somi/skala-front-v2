// 성적 계산기 과제 - 3과목 점수를 입력받아 평균/합격 여부/등급을 계산한다.
// 원래 요구사항은 prompt()로 연속 입력을 받지만, 이 페이지에서는 다이얼로그 폼의
// 입력 필드 3개를 subjects 배열과 같은 순서로 읽어 total에 합산하는 방식으로 대체한다.
(function () {
    var subjects = ["HTML", "CSS", "JavaScript"];
    var inputIds = ["grade-input-html", "grade-input-css", "grade-input-js"];

    var dialog = document.getElementById('grade-dialog');
    var trigger = document.getElementById('grade-trigger');
    var closeBtn = dialog.querySelector('.dialog-close');
    var calcBtn = document.getElementById('grade-calc-btn');
    var result = document.getElementById('grade-result');

    function getGrade(average) {
        if (average >= 90) return 'A';
        if (average >= 80) return 'B';
        if (average >= 70) return 'C';
        if (average >= 60) return 'D';
        return 'F';
    }

    function calculate() {
        var total = 0;
        var i;

        for (i = 0; i < subjects.length; i++) {
            var input = document.getElementById(inputIds[i]);
            var score = Number(input.value);

            if (!input.value || score < 0 || score > 100) {
                result.className = 'is-fail';
                result.textContent = subjects[i] + ' 점수를 0~100 사이로 입력해주세요.';
                return;
            }

            total += score;
        }

        var average = total / subjects.length;
        var isPass = average >= 60;
        var grade = getGrade(average);

        result.className = isPass ? 'is-pass' : 'is-fail';
        result.textContent = '총점: ' + total + '점, 평균: ' + average.toFixed(1) +
            ', 결과: ' + (isPass ? '합격' : '불합격') + '입니다! (등급: ' + grade + ')';
    }

    function resetForm() {
        var i;
        for (i = 0; i < inputIds.length; i++) {
            document.getElementById(inputIds[i]).value = '';
        }
        result.textContent = '';
        result.className = '';
    }

    trigger.addEventListener('click', function () {
        resetForm();
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

    calcBtn.addEventListener('click', calculate);
})();
