document.addEventListener('DOMContentLoaded', function () {
    activateSections('add-list-section');
});

var allSectionsIds = ['add-list-section', 'list-of-lists-section', 'single-list-section'];

function activateSections(sectionId, listKey) {
    if (!sectionId) return;
    for (var id of allSectionsIds) {
        if (id === sectionId) {
            document.getElementById(id).style.display = 'block';
        } else {
            document.getElementById(id).style.display = 'none';
        }
    }

    switch (sectionId) {
        case 'add-list-section':
            setUpAddListSection();
            break;
        case 'list-of-lists-section':
            setUpListOfListsSection();
            break;
        case 'single-list-section':
            if (listKey) setUpSingleListSection(listKey);
            break;
        default:

    }
}

/* ******************** add-list-section *************** */
function setUpAddListSection() {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        document.getElementById('url').innerText = tabs[0].url;
        document.getElementById('item-title').innerText = tabs[0].title;
    });
    
    document.getElementById('add-list-div').style.display = 'none';
    document.getElementById('create-list-button')
        .addEventListener('click', onCreateListButtonClick);
    document.getElementById('add-new-list-button')
        .addEventListener('click', onAddNewListButtonClick);
    document.getElementById('cancel-new-list-button')
        .addEventListener('click', onCancelButtonClick);
    document.getElementById('export-data-button')
        .addEventListener('click', exportData);
    document.getElementById('all-lists-button')
        .addEventListener('click', function () {
            activateSections('list-of-lists-section');
        });
    listCheckBoxes();
}
function exportData() {
    chrome.storage.sync.get('allLists', function(allListsData) {
        var jsonData = JSON.stringify(allListsData , null, 4);
        
        var downloadLink = document.createElement('a');
        var blob = new Blob([jsonData], {type: "octet/stream"});
        var fileName = 'all_lists_data.json';
        var downloadUrl = window.URL.createObjectURL(blob);
        downloadLink.setAttribute('href', downloadUrl);
        downloadLink.setAttribute('download', fileName );
        downloadLink.click();
    });
    
}

function importData() {
    chrome.storage.sync.set({'allLists' : allListsData},  function () {
    });   
}

function isEmpty(obj) {
    if (!obj) return true;
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function listCheckBoxes() {
    chrome.storage.sync.get('allLists', function(allListsData) {
        if (isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            // TODO
            console.log('No lists created!');
            return;
        } 
        allListsData = allListsData.allLists;
        document.getElementById('lists-div').innerHTML = '';
        var url = document.getElementById('url').innerText;
        for (var key in allListsData) {
            appendListChild(key, allListsData[key].name, !isEmpty(allListsData[key].urlMap[url]));
        }
    });
}

function onCancelButtonClick() {
    document.getElementById('add-list-div').style.display = 'none';
    document.getElementById('create-list-button').style.display = 'block';
}

function appendListChild(key, listName, checked) {
        var container = document.getElementById('lists-div');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.setAttribute('key', key);
        checkbox.value = listName;
        checkbox.checked = checked;
        checkbox.addEventListener('change', listOfListsCheckBoxEventCallBack); 
    
        var label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.appendChild(document.createTextNode(listName));
    
        container.appendChild(checkbox);
        container.appendChild(label);
        container.appendChild(document.createElement('br'));
}

function listOfListsCheckBoxEventCallBack(event) {
    var listName = event.target.value;
    var listKey = event.target.getAttribute('key');
    var url = document.getElementById('url').innerText;
    var title = document.getElementById('item-title').innerText;
        if (event.target.checked) {
            addItemToList(listKey, listName, title, url);
        } else {
            removeItemFromList(listKey, url);
        }    
}

function onCreateListButtonClick() {
    document.getElementById('create-list-button').style.display = 'none';
    document.getElementById('add-list-div').style.display = 'block';
    document.getElementById('new-list-name').focus();
}

function onAddNewListButtonClick() {

    document.getElementById('create-list-button').style.display = 'block';
    document.getElementById('add-list-div').style.display = 'none';
    var url = document.getElementById('url').innerText;
    var title = document.getElementById('item-title').innerText;

    var listName = document.getElementById('new-list-name').value;
    if (!listName || listName.length < 1) {
        // TODO
    }
    var listKey = ('' + listName).toLocaleLowerCase();
    addItemToList(listKey, listName, title, url, appendListChild);
}


function addItemToList(listKey, listName, title, url, afterDataUpdateCallback) {
    
    chrome.storage.sync.get('allLists', function(allListsData) {
        
        if (isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            console.log('No lists existing, adding first element');
            allListsData = {};
        } else {
            allListsData = allListsData.allLists;
        } 

        if (allListsData[listKey] && allListsData[listKey].urlMap) {
            allListsData[listKey].urlMap[url] = title;
        } else {
            var listVal = { name :  listName, urlMap : {}};
            listVal.urlMap[url] = title;
            allListsData[listKey] = listVal;
        }

        chrome.storage.sync.set({'allLists' : allListsData},  function () {
            if (afterDataUpdateCallback) afterDataUpdateCallback(listKey, listName, true);
        });
        
      });
}

function removeItemFromList(listKey, url, callback) {
    
    chrome.storage.sync.get('allLists', function(allListsData) {
        
        if (isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            return;
        } 
        allListsData = allListsData.allLists;
        delete allListsData[listKey].urlMap[url];
        
        chrome.storage.sync.set({'allLists' : allListsData},  function () {
            if (callback) callback(listKey);
        });
        
      });
}


/* ******************** list-of-lists-section *************** */
function setUpListOfListsSection() {
    document.getElementById('go-to-main-button').addEventListener('click', function () {
        activateSections('add-list-section');
    });

    document.getElementById('select-all-lists-button').addEventListener('click', selectAllLists);
    document.getElementById('unselect-all-lists-button').addEventListener('click', unSelectAllLists);
    document.getElementById('delete-selected-lists-button').addEventListener('click', deleteSelectedLists);

    
    drawListOfLists();
}

function drawListOfLists() {
    chrome.storage.sync.get('allLists', function(allListsData) {
        var listBox = document.getElementById('list-of-lists-box');
        listBox.innerHTML = '';
        if (isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            console.log('No lists created!');
            listBox.innerHTML = 'No lists!';
        } 
        allListsData = allListsData.allLists;
        

        var table = document.createElement('table');
        table.appendChild(document.createElement('thead'));
        table.className = 'list-table';
        var tbody = document.createElement('tbody');
        var i = 0;
        for (var key in allListsData) {
            var trow = document.createElement('tr');

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'list-unit';
            checkbox.checked = false;
            checkbox.setAttribute('key', key);
            trow.appendChild(checkbox);

            var td = document.createElement('td');
            td.appendChild(document.createTextNode(++i));
            trow.appendChild(td);
            
            td = document.createElement('td');
            var link = document.createElement('a');
            link.appendChild(document
                .createTextNode(allListsData[key].name)
                );

                
            link.title = allListsData[key].name;
            link.href = "#";
            link.setAttribute('key', key);
            link.className = 'list-link';
            link.addEventListener('click', event => {
                activateSections('single-list-section', event.target.getAttribute('key'));
            });

            td.appendChild(link);
            td.appendChild(document
                .createTextNode(' (' + Object.keys(allListsData[key].urlMap).length + ')'));

            trow.appendChild(td);
            tbody.appendChild(trow);
        }
        table.appendChild(tbody);

        listBox.appendChild(table);
    });  
}

function selectAllLists() {
    var listUnits = document.getElementsByClassName('list-unit');
    for (var i = 0; i < listUnits.length; i++) {
        listUnits[i].checked = true;
    }
}

function unSelectAllLists() {
    var listUnits = document.getElementsByClassName('list-unit');
    for (var i = 0; i < listUnits.length; i++) {
        listUnits[i].checked = false;
    }
}

function deleteSelectedLists() {
    var listUnits = document.getElementsByClassName('list-unit');
    var keys = [];
    for (var i = 0; i < listUnits.length; i++) {
        var listUnit = listUnits[i];
        if (listUnit.checked) keys.push(listUnit.getAttribute('key'));
    }
    deleteLists(keys, drawListOfLists); 
}

function deleteLists(keys, callback) {
    chrome.storage.sync.get('allLists', function(allListsData) {
        
        if (!keys || (keys.length < 1) || isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            return;
        } 
        allListsData = allListsData.allLists;
        console.log(allListsData);
        console.log(keys);
        for (var i = 0; i < keys.length; i++) {
            delete allListsData[keys[i]];
        }
        console.log(allListsData);
        chrome.storage.sync.set({'allLists' : allListsData},  function () {
            if (callback) callback();
        });
        
      });
}


/* ******************** single-list-section *************** */

function setUpSingleListSection(listKey) {
    document.getElementById('go-to-main-button-2').addEventListener('click', function () {
        activateSections('list-of-lists-section');
    });

    document.getElementById('delete-from-list-button')
        .addEventListener('click', deleteSelectedItemsFromList);

    document.getElementById('select-all-items-button')
        .addEventListener('click', selectAllItems);

    document.getElementById('unselect-all-items-button')
        .addEventListener('click', unSelectAllItems);
        
    drawListOfItems(listKey);

}

function drawListOfItems(listKey) {
    chrome.storage.sync.get('allLists', function(allListsData) {
        if (isEmpty(allListsData) || isEmpty(allListsData.allLists)) {
            // TODO
            console.log('No lists created!');
            return;
        } 
        allListsData = allListsData.allLists;
        document.getElementById('list-title').innerText = allListsData[listKey].name;
        var urlMap = allListsData[listKey].urlMap;
        var listBox = document.getElementById('list-of-items-box');

        if (isEmpty(urlMap) || urlMap.length == 0) {
            listBox.innerText = 'No data!';
            return;
        }
        listBox.innerHTML = '';
        var table = document.createElement('table');
        table.appendChild(document.createElement('thead'));
        table.className = 'item-table';
        var tbody = document.createElement('tbody');
        var i = 0;
        for (var url in urlMap) {
            var trow = document.createElement('tr');

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'list-item';
            checkbox.checked = false;
            checkbox.setAttribute('url', url);
            checkbox.setAttribute('listKey', listKey);
            trow.appendChild(checkbox);

            var td = document.createElement('td');
            td.appendChild(document.createTextNode(++i));
            trow.appendChild(td);
            td = document.createElement('td');
            
            var link = document.createElement('a');
            link.appendChild(document.createTextNode(urlMap[url]));
            link.title = url;
            link.href = url;
            link.className = 'item-link';
            td.appendChild(link);
            trow.appendChild(td);
            tbody.appendChild(trow);
        }
        table.appendChild(tbody);
        listBox.appendChild(table);
    }); 
}

function deleteSelectedItemsFromList() {
    var listItems = document.getElementsByClassName('list-item');
    var listKey = '';
    for (var i = 0; i < listItems.length; i++) {
        if (listItems[i].checked) {
            var url = listItems[i].getAttribute('url');
            listKey = listItems[i].getAttribute('listKey');
            removeItemFromList(listKey, url, drawListOfItems);
        }
        
    }
}

function selectAllItems() {
    var listItems = document.getElementsByClassName('list-item');
    for (var i = 0; i < listItems.length; i++) {
        listItems[i].checked = true;
    }
}

function unSelectAllItems() {
    var listItems = document.getElementsByClassName('list-item');
    for (var i = 0; i < listItems.length; i++) {
        listItems[i].checked = false;
    }
}
