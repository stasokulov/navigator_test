const apiGoogleSheets = 'https://script.google.com/macros/s/AKfycbxp16AV4lh7346tpIoOH5TjcEPvDBZeLB8V01blFZG5eTQ3BKY/exec';

(function requestAPI () {
    //Запрашиваем данные из гугл-таблицы.
        fetch(apiGoogleSheets)
        .then(response => {
            if (response.status == 200) {
                return response.json() //Передаю дальше JSON с данными
            } else {
                alert('Гугл-таблица не доступна. Ошибка: ' + response.status)
            }
        })
        .then(json => {
            //Получаю объект с элементами. Значение каждого элемента - массив массивов (назовем их подмассивами).
            //Каждый подмассив - строка в таблице. Пустые значения - пустые ячейки. Есть строки где все ячейки - пустые.
            //Избавимся от пустых ячеек и запишем массивы в новый объект.

            let newObj = {};

            for(let key in json) {
                const arrOfArrsWithHoles = json[key];
                const arrOfArrsNoHoles = arrOfArrsWithHoles.map( arrWithHoles => {
                    //Возвращаю только элементы, возвращающие true (т.е. не пустые).
                    const newArrNoHoles = arrWithHoles.filter(element => {
                        return element;
                    });
                    //Тепрь это подмассив без дырок.
                    return newArrNoHoles;
                });
                //Избавимся от пустых подмассивов.
                const arrOfArrsNoEmptyArrs = arrOfArrsNoHoles.filter(element => {
                    if(element[0]) {
                        return element;
                    };
                });

                //Записываю массив в новый объект, имя ключа беру прежнее.
                newObj[key] = arrOfArrsNoEmptyArrs;
            };
            return newObj;
        })
        .then(response => {
            //Запускаю построение древовидного объекта из данных массива.
            createDataBase(response);
        })
        /*
        .catch((err) => alert(
            'Не удалось запросить или обработать данные. Сделайте скриншот и обратитесь к администратору. ' + err
        ));
        */
})();

function createDataBase(objOfArrs) {
    //Добавим в каждый массив первого конструктора доп. элемент, для схожести со вторым конструктором.
    objOfArrs.constructor_1.map(arr => {
        arr.unshift(arr[0]);
        return arr;
    });

    //Объекты для заполнения данными конструкторов.
    let objConstr_1 = {items: []};
    let objConstr_2 = {items: []};

    //Наполняем объекты данными.
    arrOfConstructorToTree(objOfArrs.constructor_1, objConstr_1);
    arrOfConstructorToTree(objOfArrs.constructor_2, objConstr_2);

    //Зесь сольем конструкторы.
    let objConstrMain = {items: []};

    //Клонируем objConstr_1 в objConstrMain.
    objConstr_1.items.forEach(obj => {
        let clone1 = {};
        for (var key in obj) {
            clone1[key] = obj[key];
        };

        let arr = [];
        obj.items.forEach(obj => {
            let clone2 = {};
            for (var key in obj) {
                clone2[key] = obj[key];
            };
            arr.push(clone2);
        });
        clone1.items = arr;
        objConstrMain.items.push(clone1);
    });

    //Наращиваем концы ветвей objConstrMain ветвями objConstr_2. Стыкуем по id.
    objConstrMain.items.forEach(obj => {
        obj.items.forEach(objConstrMain => {
            objConstr_2.items.forEach(objConstr2 => {

                if(objConstrMain.id === objConstr2.id) {
                    for (var key in objConstr2) {
                        objConstrMain[key] = objConstr2[key];
                    };
                };
            });

            if(
                !objConstr_2.items.some( objConstr2 => {
                    return (objConstrMain.id === objConstr2.id)
                })
            ) {
                objConstrMain.items = [{id: 'Нет данных'}];
                objConstrMain.name = 'Нет данных';
            };
        });
    });

    //Создаем древовидный объект-библиотеку из массива-библиотеки.
    let lib = {};
    objOfArrs.library.forEach(arr => {
        createBranch(lib, arr, 0);
    });

    //Запускаю создание итоговой базы данных, с которой будет отрисовываться меню.
    createResultBase(objConstrMain, lib);
};

function arrOfConstructorToTree(objOfArrs, objConstr) {
    objOfArrs.forEach(line => {
        if (
            //Если на этом уровне базы данных в массиве items уже есть объект с таким именем,
            objConstr.items.some(element => {
                return element.id === line[0];
            })
        ) {
            //то находим его, заходим в items и создаем там объект со свойством items и значением слота.
            objConstr.items.forEach(element => {
                if(element.id === line[0]) {
                    addId(element.items, line[2]);
                };
            });
        } else {
            //Если объекта с таким именем нет, то создаем его и добавляем в конец массива.
            addNameAndId(line, objConstr.items);
        };
    });
};

function addNameAndId(line, items) {
    const obj = {};
    obj.id = line[0];
    obj.name = line[1];
    obj.items = [];
    addId(obj.items, line[2]);
    items.push( obj );
};

function addId(items, id) {
    const obj = {};
    obj.id = id;
    items.push( obj );
};

function createBranch (obj, arr, i) {
    if ( !arr[i] ) {
        //Если элемент не существует, то останавливаемся.
        return;
    };

    if( arr[i] === 'content' ) {
        //Если натыкаемся на ячейку со значением 'content', то записываем в объект следующее за этим значение.
        //Там лежит ссылка на API Google Docs. Останавливаемся.
        obj.content = arr[i+1];
        return;
    };

    if ( !obj.items ) {
        //Если у объекта нет свойства items, то создаем его.
        addItems(obj);
    };

    if (
        //Если на этом уровне базы данных в массиве items уже есть объект с таким именем,
        obj.items.some(element => {
            return element.name === arr[i];
        })
    ) {
        //то находим его и запускаем проверку внутри этого объекта.
        //Проверяем следующий элемента подмассива(следующей ячейки из гугл-таблицы).
        //Таким образом рекурсивно вызывая функцию, проходим по цепочке вложенных друг в друга объектов,
        //создавая новые ветви, ветви ветвей и т.д.
        obj.items.forEach(element => {
            if(element.name === arr[i]) {
                createBranch(element, arr, i + 1);
                return;
            };
        });
    } else {
        //Если объекта с таким именем нет, то создаем его и добавляем в конец массива.
        addName(arr[i], obj.items);
        //Переходим в созданный объект и запускаем в нем проверку по следующему значению из строки гугл-таблицы.
        const lastObj = obj.items.length - 1;
        createBranch(obj.items[lastObj], arr, i + 1);
    };
};

function addName(name, arr) {
    const obj = {};
    obj.name = name;
    arr.push( obj );
};

function addItems(obj) {
    obj.items = [];
};

function createResultBase(objConstrMain, library) {
    //Сюда создадим результат сборки финального объекта из конструктора и библиотеки.
    const resultBase = {
        name: 'Сферы бизнеса',
        items: [],
    };

    const noData = library.items.filter( (stageLib) => stageLib.name === 'Нет данных');

    //Переносим в итоговую базу данные конструктора.
    resultBase.items = objConstrMain.items;
    //Потом проходимся по пунктам. При совпадении имени пункта в итоговой базе и библиотеке - наполняем
    //итоговую базу содержимым пункта библиотеки.
    //Перебираем сферы бизнеса.
    resultBase.items.forEach(sphereOfBussines => {
        //Проверка на заполненность второго столбца в конструкторе. Если он пуст, то подставляем массив-заглушку.
        if( !sphereOfBussines.items ) {
            sphereOfBussines.items = [{name: 'Нет данных'}];
        };
        //Перебираем продукты.
        sphereOfBussines.items.forEach(productInConstructor => {
            //Пребираем стадии продажи.
            productInConstructor.items.forEach(stageConstr => {
                //Перебираем библиотеку и сравниваем имена элементов с id стадии продажи.
                library.items.forEach( stageLib => {
                    if (stageLib.name === stageConstr.id) {
                        //При совпадении - записываем свойства объекта из библиотеки в итоговую базу.
                        stageConstr.name = stageLib.items[0].name;
                        if(stageLib.items[0].items) {
                            stageConstr.items = stageLib.items[0].items;
                        };
                        if(stageLib.items[0].content) {
                            stageConstr.content = stageLib.items[0].content;
                        };

                        if(!stageConstr.items&&!stageConstr.content) {
                            stageConstr.items = noData[0].items;
                        };
                    };

                    if(
                        !library.items.some( stageLib => {
                            return (stageLib.name === stageConstr.id)
                        })
                    ) {
                        stageConstr.items = noData[0].items;
                        stageConstr.name = noData[0].name;
                    };
                });
            });
        });
    });

    //Прячем прелоадер.
    const preloaderMain = document.querySelector('.preloader__wrap_main');
    preloaderMain.classList.add('invis');
    //Запуск построения меню в разметке страницы.
    createMenu(resultBase);
};