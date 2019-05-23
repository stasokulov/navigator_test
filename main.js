const preloaderOutput = document.querySelector('.preloader__wrap_output');

function createMenu(base) {
    const menu = document.querySelector('.menu');
    //Заполняем меню пунктами из базы данных
    createBranchMenu(menu, base, 'vis');
    //Вешаем слушатель кликов на меню
    menu.addEventListener( 'click', openMenu );
};

//Заполняем блок элементами базы данных
function createBranchMenu(parent, base, visible) {
    //Создаем обертку для пунктов меню
    const wrap = createDiv();
    wrap.classList.add(visible);
    wrap.classList.add('items');
    //Создаем шапку подменю
    const heder = createDiv();
    heder.classList.add('menu__title');
    heder.innerText = base.name;
    wrap.appendChild(heder);
    //Создаем шаблон пункта меню
    const templateMenuItem = createDiv();
    templateMenuItem.classList.add('menu__item');
    //Создаем пункты меню из элементов базы данных
    base.items.forEach(element => {
        let newMenuItem = templateMenuItem.cloneNode(true);
        newMenuItem.innerText = element.name;

        //Если у элемента массива есть свой подмассив элементов, то наполняем пункт меню пунктами подменю,
        //рекурсивно вызывая эту же функцию.
        if (element.items) {
            createBranchMenu(newMenuItem, element, 'invis');

        //Если элемент содержит ссылки на контент, то записываем их как дата-аттрибут.
        } else if (element.content) {
            const div = createDiv();
            div.classList.add('invis');
            div.classList.add('content');
            div.dataset.content = element.content;
            newMenuItem.appendChild(div);
        };
        wrap.appendChild(newMenuItem);
    });
    //Добавляем пустой блок в конце. Будем выводить в него подпункты при клике на пункт меню
    const div = createDiv();
    wrap.appendChild(div);
    parent.appendChild(wrap);
};

function openMenu(event) {
    const block = event.target;
    //Если клик был по пункту меню
    if ( block.classList.contains('menu__item') ) {
        const parent = block.parentNode;
        const child = block.lastElementChild;
        const output = document.querySelector('#output__inner');
        //Очищаем область вывода
        output.innerHTML = '';
        //Удаляем нижележащее дерево меню, отображенное ранее
        parent.lastElementChild.innerHTML = '';
        //Выделяем кликнутый пункт
        toHiglight(block);
        //Если есть подпункты в этом пункте
        if ( child.classList.contains('items') ) {
        //Клонируем их, делаем видимыми и вставляем в блок для отображения
        const subItems = child.cloneNode(true);
        subItems.classList.remove('invis');
        parent.lastElementChild.appendChild(subItems);
        //Если в пункте ссылки на контент, то создаем iframe и вставляем в правую часть навигатора.
        } else if ( child.classList.contains('content') ) {
            const content = document.createElement('iframe');
            //Ссылку для фрейма берем из дата-атрибута. embedded=true убрает служебные слова.
            content.setAttribute('src', child.dataset.content + '?embedded=true');
            content.classList.add('frame');
            content.classList.add('invis'); //Невидимость уберем после прогрузки фрейма.
            content.setAttribute('frameborder', 0); //Этот аттрибут убирает некрасивую рамку вокруг iframe.
            output.appendChild(content);
            preloaderOutput.classList.remove('invis'); //Запускаем прелоадер.
            checkIframe(content); //Проверяем прогрузку фрейма.
        };
    };
};

function checkIframe(content) {
    //Каждые 100 миллисекунд проверяем фрейм. Когда во фрейм подгрузятся данные со стороннего сервера,
    //доступ к внутренностям фрейма станет закрыт, поймаем ошибку, значит пора показать фрейм (до этого он пуст).
    const checkIframe = setInterval( () => {
        try {
            return content.contentWindow.document;
        } catch {
            clearInterval(checkIframe); //Останавливаем setInterval.
            preloaderOutput.classList.add('invis'); //Скрываем преловдер.
            content.classList.remove('invis'); //Делаем фрейм видимым.
        };
    }, 100 );
};

function toHiglight(block) {
    //Убираем выделение с ранее выделенных пунктов меню
    const menuItems = Array.from( block.parentElement.querySelectorAll('.menu__item') );
    menuItems.forEach(element => {
        element.classList.remove('active');
    });
    //Выделяем кликнутый пункт
    block.classList.toggle('active');
};

function createDiv() {
    const div = document.createElement('div');
    return div;
};
