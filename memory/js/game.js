
var dragSound = new Audio("./sounds/Collect_Point.mp3");
var dropSound = new Audio("./sounds/Craft.mp3");
var oridropSound = new Audio("./sounds/Hit.mp3");
oridropSound.volume = 0.2;
var loseSound = new Audio("./sounds/Jingle_Lose.mp3");
var winSound = new Audio("./sounds/Jingle_Win.mp3");
var coinSound = new Audio("./sounds/Point.mp3");
var newReward;
var gameTm;
var startTime;
var modal_menu, modal_win, modal_howto;
var currentClick = 0;
var record = null;
var newGame;
var cover = { "easy": "Card_Easy.png", "mid": "Card_Mid.png", "hard": "Card_Hard.png" };
var BoardLayout = { "easy": "px-5 row row-gap-3 row-cols-2 row-cols-lg-4", "mid": "row row-gap-2 g-2 row-cols-4 row-cols-lg-4", "hard": "w-100 row row-gap-0 g-0 row-cols-4 row-cols-lg-8" };
// var CardLayout = { "easy": "col-6 col-lg-3", "mid": "col-3 col-lg-3", "hard": "col-lg-3" };
var openedCard = [], correct = 0;
var Animation = [];
var gameVue = Vue.createApp({
    data() {
        return { board: [], level: "easy" }
    },
    render() {
        $("#cardBoard").removeClass().addClass(BoardLayout[this.level]);
        var vnodes = [];
        this.board.forEach((item, idx) => {
            vnodes.push(Vue.h("div", { class: "d-flex justify-content-center" },
                Vue.h("div", { class: "card d-felx justify-content-start", "data-cardNo": idx },
                    [Vue.h("img", { src: "animations/" + item.ani, id: "card_" + idx, class: "cardAni", style: "width:" + item.width + "px" }),
                    Vue.h("img", { src: "covers/" + cover[this.level], class: "cardCover", "data-cardNo": idx })
                    ]
                )))
        })
        return vnodes;
    },
    updated: function () {
        $("#gamebox").removeClass("hardBox midBox easyBox");
        if (gameVue.level == "hard")
            $("#gamebox").addClass("hardBox");
        else if (gameVue.level == "easy")
            $("#gamebox").addClass("easyBox");
        else $("#gamebox").addClass("midBox");

        Animation = [];
        gameVue.board.forEach((item, idx) => {
            var newAni = gsap.timeline();
            var frame_count = item.frames, offset_value = 128;
            var selector = "#card_" + idx;
            newAni.to(selector, {
                x: (-offset_value * frame_count),
                ease: "steps(" + frame_count + ")", // use a stepped ease for the sprite sheet
                // end: "+=" + (offset_value * frame_count),
                duration: item.frames / 6,
                repeat: -1,
                repeatDelay: 0
            })
            newAni.pause();
            Animation.push(newAni);
        });
        if (gameVue.board.length > 0) {
            $("#gamebox").removeClass("invisible");
            gsap.from("#gamebox", {
                y: -500, opacity: 0, duration: 1, delay: 0.3, onComplete: () => {
                    gsap.set("#gamebox", { clearProps: 'all' });
                }
            });

            startTime = new Date();
            gameTm = setInterval(() => {
                $(".timer").show();
                var now = new Date();
                var elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                $(".timer p").html(formatSecondsToHMS(elapsed));
            }, 1000);

            $(".card").on("click", (event) => {
                var cardno = parseInt(event.currentTarget.dataset.cardno);
                if ((openedCard.length == 1 && openedCard[0] == cardno) || newGame.board[cardno].done) return;
                else if (!$(".card[data-cardno='" + cardno + "']").hasClass("toHide")) {
                    if (openedCard.length < 2 && !newGame.board[cardno].done) {
                        openedCard.push(cardno);
                        $(event.currentTarget).children(".cardCover").addClass("toHide");
                        redayToPlay(parseInt(event.currentTarget.dataset.cardno));
                    } else
                        return;
                }
            });
            $(".card").hover((event)=>{
                var cardno = parseInt(event.currentTarget.dataset.cardno);
                if(Animation[cardno].paused() && newGame.board[cardno].done)
                    Animation[cardno].restart();
                },
            (event)=>{
                var cardno = parseInt(event.currentTarget.dataset.cardno);
                 if(Animation[cardno].isActive() && newGame.board[cardno].done)
                    Animation[cardno].pause(0);
                }
        )
        } else {
            $("#gamebox").addClass("invisible");
            adjVolume();
        }
    }
}).mount("#cardBoard");

$(function () {

    //prevent the modal's attrib 'ari-hidden' been blocked

    document.querySelectorAll('.modal').forEach((modalElement) => {
        modalElement.addEventListener('hide.bs.modal', () => {
            if (document.activeElement && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        });
    });

    $("#memoryHowto").on("ended", function () {
        setTimeout(() => {
            modal_howto.hide();
            $("#memoryHowto").get(0).currentTime = 0;
            modal_menu.show();
        }, 1500);
    })
    $(window).on("resize", resizeHandler);
    var vol = localStorage.getItem("volume");
    if (vol == null) {
        localStorage.setItem("volume", 5);
    } else {
        $("#auVolume").val(parseInt(vol));
        $("#lblVolume").html("音量: " + (vol / 10) * 100 + "%");
    }
    $("#auVolume").on("input", adjVolume);

    modal_menu = new bootstrap.Modal(document.getElementById("menuModal"), {});
    modal_menu.show();
    modal_win = new bootstrap.Modal(document.getElementById("winModal"), {});
    modal_win.hide();
    modal_howto = new bootstrap.Modal(document.getElementById("howtoModal"), {});
    modal_howto.hide();

    record = JSON.parse(localStorage.getItem("MemoryRecord"));

    $("#btnMenu1").on("click", () => { modal_menu.hide(); setTimeout(startGame, 500, "easy"); });
    $("#btnMenu2").on("click", () => { modal_menu.hide(); setTimeout(startGame, 500, "mid") });
    $("#btnMenu3").on("click", () => { modal_menu.hide(); setTimeout(startGame, 500, "hard") });
    $("#btnBack").on("click", () => { history.back() });
    $("#btnBackMenu").on("click", () => { backtoMenu() });
    $("#btnHowToMenu").on("click", () => {
        modal_howto.hide();
        modal_menu.show();
    });
    $("#btnHow").on("click", () => { openHowto() });
    $("#btnReplay").on("click", () => { replayGame() })
    adjVolume();
    $("#logo").on("click",()=>{
        record[gameVue.level]={ time: 99999, click: 99999 };
        localStorage.setItem("MemoryRecord", JSON.stringify(record));
    })
});

function startGame(_level) {

    currentClick = 0;
    if (record == null) {
        record = { "easy": { time: 99999, click: 99999 }, "mid": { time: 99999, click: 99999 }, "hard": { time: 99999, click: 99999 } };
    }
    if (record[_level].time < 99999 || record[_level].click < 99999)
        $(".score").html("紀錄:" + record[_level].time + "秒/" + record[_level].click + "次");
    else {
        $(".score").html("最佳紀錄:無");
    }
    correct = 0; openedCard = [];
    if (_level == "hard")
        $("body").css('background-image', 'url("images/Bg_Hard_Blur.jpg")');
    else
        $("body").css('background-image', 'url("images/Bg_Normal_Blur.jpg")');

    // modal_win.hide();
    newGame = new Pair(_level);
    newGame.addEventListener("pairready", (event) => {
        // console.log(event);
        if (event.detail.boardSize > 0) {
            //build game
            gameVue.board = newGame.board;
            gameVue.level = _level;
        }
        else {
            //error
        }
    })
}

function adjVolume() {
    var vol = $("#auVolume").val();
    localStorage.setItem("volume", vol);
    $("#lblVolume").html("音量: " + (vol / 10) * 100 + "%");
    dragSound.volume = vol / 10;
    dropSound.volume = vol / 10;
    oridropSound.volume = vol / 10;
    loseSound.volume = vol / 10;
    winSound.volume = vol / 10;
    coinSound.volume = vol / 10;
}
function resizeHandler() {
    // size.width = window.innerWidth;
    // size.height = window.innerHeight;
}

function redayToPlay(no) {
    currentClick++;
    Animation[no].restart();
    dragSound.currentTime = 0;
    dragSound.play();
    if (openedCard.length == 2) {
        if (newGame.checkAnswer(openedCard[0], openedCard[1])) {
            //right
            var re1 = openedCard[0], re2 = openedCard[1];
            newGame.board[re1].done = true;
            newGame.board[re2].done = true;
            $(".card[data-cardno='" + re1 + "']").addClass("bravo").append("<h3 class='wordname'>" + newGame.board[re1].wordName + "</h3>");
            $(".card[data-cardno='" + re2 + "']").addClass("bravo").append("<h3 class='wordname'>" + newGame.board[re1].wordName + "</h3>");
            correct += 2;
            coinSound.play();
            setTimeout(() => {
                Animation[re1].pause(0);
                Animation[re2].pause(0);;
            }, newGame.board[re2].frames / 6 * 1000);
            openedCard = []
            if (correct == newGame.board.length) {
                //success
                var newRecord = false;
                clearInterval(gameTm);
                var level = gameVue.level;

                now = new Date()
                elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
                var prevTime = record[level].time, prevClick = record[level].click;
                var timeImproved = elapsed < prevTime, clickImproved = currentClick < prevClick;
                if (timeImproved) {
                    newRecord = true;
                    record[level].time = elapsed;
                }
                if (clickImproved) {
                    newRecord = true;
                    record[level].click = currentClick;
                }
                var firstRecord = prevTime >= 99999 && prevClick >= 99999;
                var headLine = firstRecord ? "新紀錄！" : ((timeImproved && clickImproved) ? "雙紀錄！" : "破紀錄！");
                var deltaChips = buildDeltaChips(timeImproved, clickImproved, prevTime, prevClick, elapsed, currentClick);
                var showScore = "<h3 id='scoreTitle'>成績: " + elapsed + "秒/" + currentClick + "次</h3>"
                if (newRecord) {
                    showScore = showScore.concat("<div id='winBanner'><span class='recTag'>" + headLine + "</span>" + deltaChips + "</div>");
                    localStorage.setItem("MemoryRecord", JSON.stringify(record));
                    $("#IOSVid").attr("src", "./images/very_good.mov");
                    $("#AndroidVid").attr("src", "./images/very_good.webm");
                    celebrateRecord(headLine, deltaChips, firstRecord);
                } else {
                    showScore = showScore.concat("<p class='keepCheer'>離紀錄只差一點點了，再試一次！</p>");
                    $("#IOSVid").attr("src", "./images/keep_going.mov");
                    $("#AndroidVid").attr("src", "./images/keep_going.webm");
                }
                $("#vidplayer")[0].load();
                $("#vidplayer").fadeIn();
                $('#vidplayer').get(0).play();
                setTimeout(() => {
                    $("#winModal .modal-header").empty().append(showScore);
                    modal_win.show();
                    winSound.play();
                    if (newRecord) {
                        // 海報進場：標題彈跳、數字滾動、金色小彩帶
                        gsap.from("#scoreTitle", { scale: 2.1, opacity: 0, duration: 0.55, ease: "back.out(2.2)" });
                        gsap.from("#winBanner .recTag", { scale: 0, rotation: -20, duration: 0.6, ease: "back.out(2.5)", delay: 0.25 });
                        rollUpNumbers("#winModal .modal-header");
                        headerConfetti();
                        $(".score").html("紀錄:" + record[level].time + "秒/" + record[level].click + "次<span id='newrecord'></span>");
                    }
                }, 2000);
            }
        } else {//reset
            var re1 = openedCard[0], re2 = openedCard[1];
            setTimeout(() => {
                Animation[re1].pause(0);
                Animation[re2].pause(0);
                if (!newGame.board[re1].done)
                    $(".cardCover[data-cardno='" + re1 + "']").removeClass("toHide");
                if (!newGame.board[re2].done)
                    $(".cardCover[data-cardno='" + re2 + "']").removeClass("toHide");

            }, newGame.board[re2].frames / 8 * 1000);
            openedCard = [];
        }

    } else return;
}

function replayGame() {
    $(".card").off("click");
    newGame = null;
    gameVue.board = [];
    modal_win.hide();
    setTimeout(startGame, 300, gameVue.level);
}
function openHowto() {
    modal_menu.hide();
    modal_howto.show();
    setTimeout(() => {
        $("#memoryHowto").get(0).currentTime = 0;
        $("#memoryHowto").get(0).play();
    }, 1000);
}
function backtoMenu() {
    $(".card").off("click");
    newGame = null;
    gameVue.board = [];
    modal_win.hide();
    modal_menu.show();
}

function formatSecondsToHMS(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (num) => (num < 10 ? '0' + num : num);
    return `${pad(minutes)}:${pad(seconds)}`;
}

/* ===== 破紀錄嘉年華 (new-record carnival) ===== */
var starColors = ["#ffd34d", "#ff6ec7", "#64ffda", "#c9e704", "#ff8a3c", "#b902bc", "#7ec8ff"];

function starSvg(color) {
    return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 1.6l3.1 6.6 7.2 0.9-5.2 5.1 1.2 7.2-6.3-3.4-6.3 3.4 1.2-7.2L2.9 9.1l7.2-0.9z" fill="' + color + '"/></svg>';
}

// 彩帶與星星雨：在容器內由上往下飄落
function buildConfetti(selector, count, area) {
    var layer = document.querySelector(selector);
    if (!layer) return [];
    var frag = document.createDocumentFragment();
    var items = [];
    for (var i = 0; i < count; i++) {
        var el = document.createElement("div");
        var isStar = Math.random() < 0.35;
        var color = starColors[Math.floor(Math.random() * starColors.length)];
        el.className = isStar ? "sparkStar" : "confettiPiece";
        if (isStar) {
            el.innerHTML = starSvg(color);
        } else {
            el.style.background = color;
            el.style.boxShadow = "0 0 8px " + color;
        }
        var size = isStar ? (14 + Math.random() * 22) : (5 + Math.random() * 9);
        el.style.width = size + "px";
        el.style.height = size + "px";
        el.style.left = (Math.random() * area.w) + "px";
        el.style.top = (-20 - Math.random() * area.h * 0.3) + "px";
        el.dataset.dx = (-100 + Math.random() * 200).toFixed(1);
        el.dataset.spin = (Math.random() * 720 - 360).toFixed(1);
        frag.appendChild(el);
        items.push(el);
    }
    layer.appendChild(frag);
    items.forEach(function (el) {
        gsap.to(el, {
            y: area.h + 60,
            x: parseFloat(el.dataset.dx),
            rotation: parseFloat(el.dataset.spin),
            duration: 2.0 + Math.random() * 1.6,
            delay: Math.random() * 1.2,
            ease: "none"
        });
    });
    return items;
}

// 由中心向外炸開的星爆
function starBurst(cx, cy, n) {
    var layer = document.querySelector("#confettiLayer");
    var frag = document.createDocumentFragment();
    var items = [];
    for (var i = 0; i < n; i++) {
        var el = document.createElement("div");
        el.className = "sparkStar";
        el.innerHTML = starSvg(starColors[i % starColors.length]);
        el.style.width = "34px";
        el.style.height = "34px";
        el.style.left = (cx - 17) + "px";
        el.style.top = (cy - 17) + "px";
        var a = (i / n) * Math.PI * 2;
        var r = 150 + Math.random() * 150;
        el.dataset.dx = (Math.cos(a) * r).toFixed(1);
        el.dataset.dy = (Math.sin(a) * r).toFixed(1);
        frag.appendChild(el);
        items.push(el);
    }
    layer.appendChild(frag);
    gsap.fromTo(items, { scale: 0.1, opacity: 1, x: 0, y: 0, rotation: 0 }, {
        scale: 1,
        opacity: 0,
        rotation: 200,
        x: function (i, t) { return parseFloat(t.dataset.dx); },
        y: function (i, t) { return parseFloat(t.dataset.dy); },
        duration: 1.0,
        ease: "power3.out",
        onComplete: function () { items.forEach(function (e) { e.remove(); }); }
    });
}

// 新舊紀錄對比標籤（時間 / 步數）
function deltaChip(prev, now, label, unit) {
    if (prev >= 99999) {
        // 第一次寫下紀錄：沒有舊成績可比
        return "<span class='deltaItem'>" + label + " <b class='newNum' data-from='" + now +
            "' data-to='" + now + "'>" + now + "</b>" + unit + "</span>";
    }
    return "<span class='deltaItem'>" + label + " <b class='oldNum'>" + prev + unit + "</b> → " +
        "<b class='newNum' data-from='" + prev + "' data-to='" + now + "'>" + prev + "</b>" + unit + "</span>";
}

function buildDeltaChips(timeImproved, clickImproved, prevTime, prevClick, elapsed, clicks) {
    var chips = "";
    if (timeImproved) chips += deltaChip(prevTime, elapsed, "用時", "秒");
    if (clickImproved) chips += deltaChip(prevClick, clicks, "步數", "次");
    return chips;
}

// 數字由舊紀錄滾動到新紀錄
function rollUpNumbers(scope) {
    $(scope).find(".newNum").each(function () {
        var el = $(this);
        var from = parseInt(el.attr("data-from")), to = parseInt(el.attr("data-to"));
        var obj = { v: from };
        gsap.to(obj, {
            v: to,
            duration: 1.1,
            delay: 0.25,
            ease: "power2.out",
            onUpdate: function () { el.text(Math.round(obj.v)); },
            onComplete: function () {
                el.text(to);
                gsap.from(el, { scale: 1.7, duration: 0.45, ease: "back.out(3)" });
            }
        });
    });
}

// win modal 標題內的小彩帶
function headerConfetti() {
    var h = $("#winHeader");
    var items = buildConfetti("#winHeader", 22, { w: h.width(), h: h.height() });
    setTimeout(function () { items.forEach(function (e) { e.remove(); }); }, 3600);
}

// 主角秀：全屏嘉年華
function celebrateRecord(headLine, deltaChips, firstRecord) {
    var W = window.innerWidth, H = window.innerHeight;
    var layer = $("#celebrateLayer");
    $("#confettiLayer").empty();
    layer.removeClass("invisible").attr("aria-hidden", "false");
    gsap.set("#celebrateLayer", { autoAlpha: 1 });

    // 主秀：透明背景的 VERY GOOD 橫幅直接蓋在棋盤上
    $("#IOSBanner").attr("src", "./images/very_good.mov");
    $("#AndroidBanner").attr("src", "./images/very_good.webm");
    var banner = $("#veryGoodBanner").get(0);
    banner.load();
    var p = banner.play();
    if (p && p.catch) p.catch(function () { });
    gsap.set("#veryGoodBanner", { xPercent: -50, yPercent: -50, scale: 0.15, opacity: 0 });
    gsap.to("#veryGoodBanner", { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(1.9)" });
    gsap.to("#veryGoodBanner", {
        keyframes: [
            { scale: 1.06, duration: 0.35, ease: "sine.inOut" },
            { scale: 1, duration: 0.35, ease: "sine.inOut" },
            { scale: 1.04, duration: 0.3, ease: "sine.inOut" },
            { scale: 1, duration: 0.3, ease: "sine.inOut" }
        ],
        delay: 1.0
    });

    // 金色閃光 + 旋轉舞台光束
    gsap.fromTo("#flash", { opacity: 1 }, { opacity: 0, duration: 1.3, ease: "power2.out" });
    gsap.fromTo("#spotlight", { opacity: 0 }, { opacity: 1, duration: 0.7, delay: 0.2 });

    // 所有配對成功卡片波浪接力並重播手語動畫
    var matched = $(".card.bravo").get();
    if (matched.length > 0) {
        gsap.to(matched, {
            keyframes: [
                { scale: 1.22, y: -24, duration: 0.24, ease: "power2.out" },
                { scale: 1, y: 0, duration: 0.45, ease: "power3.inOut" }
            ],
            stagger: { each: 0.05, from: "center" }
        });
        matched.forEach(function (c, i) {
            var no = parseInt($(c).attr("data-cardno"));
            if (Animation[no]) setTimeout(function () { Animation[no].restart(); }, i * 55);
        });
    }

    // 彩帶雨 + 中心星爆
    buildConfetti("#confettiLayer", Math.min(110, Math.max(40, Math.round(W / 14))), { w: W, h: H });
    starBurst(W / 2, H * 0.28, 18);

    // 獎盃帶著旋轉光暈落下
    gsap.fromTo("#trophyWrap", { scale: 0, y: -170, opacity: 0, rotation: -25 },
        { scale: 1, y: 0, opacity: 1, rotation: 0, duration: 1.15, ease: "back.out(1.7)", delay: 0.3 });

    // 金色大標題與鼓勵字
    $("#bigTitle").text(headLine);
    gsap.fromTo("#bigTitle", { scale: 2.4, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(2.2)", delay: 1.0 });
    $("#cheerText").text(firstRecord ? "太棒了！這是你的第一份最佳紀錄" : "太棒了！你寫下新的最佳紀錄");
    gsap.fromTo("#cheerText", { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 1.35 });

    $("#scoreDelta").html(deltaChips);
    rollUpNumbers("#scoreDelta");

    coinSound.currentTime = 0;
    coinSound.play();

    // 收尾：淡出並清場
    gsap.to("#celebrateLayer", {
        autoAlpha: 0,
        duration: 0.9,
        delay: 3.9,
        onComplete: function () {
            layer.addClass("invisible").attr("aria-hidden", "true");
            $("#confettiLayer").empty();
            gsap.set("#trophyWrap, #bigTitle, #cheerText, #flash, #spotlight, #veryGoodBanner", { clearProps: "all" });
            var b = $("#veryGoodBanner").get(0);
            b.pause();
            b.currentTime = 0;
        }
    });
}
