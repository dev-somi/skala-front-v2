(function () {
    var myBag = [
        { name: "노트북", count: 1 },
        { name: "필통", count: 1 },
        { name: "물병", count: 2 },
        { name: "우산", count: 1 },
        { name: "이어폰", count: 1 }
    ];

    var dialog = document.getElementById('bag-dialog');
    var trigger = document.getElementById('bag-trigger');
    var closeBtn = dialog.querySelector('.dialog-close');
    var list = document.getElementById('bag-list');

    window.showMyBag = function () {
        list.innerHTML = '';

        for (var i = 0; i < myBag.length; i++) {
            var item = myBag[i];

            var dt = document.createElement('dt');
            dt.textContent = item.name;

            var dd = document.createElement('dd');
            dd.textContent = item.count + '개';

            list.appendChild(dt);
            list.appendChild(dd);
        }
    };

    trigger.addEventListener('click', function () {
        showMyBag();
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
})();
