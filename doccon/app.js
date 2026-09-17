/* =========================================================
   IPI DOCUMENT FINDER
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let allDocuments = [];

let filteredDocuments = [];



/* =========================================================
   DOM ELEMENTS
========================================================= */

const loaderPage =
    document.getElementById("loaderPage");

const finderPage =
    document.getElementById("finderPage");

const jsonFile =
    document.getElementById("jsonFile");

const dropZone =
    document.getElementById("dropZone");

const fileName =
    document.getElementById("fileName");

const loaderError =
    document.getElementById("loaderError");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const documentTypeFilter =
    document.getElementById("documentTypeFilter");

const departmentFilter =
    document.getElementById("departmentFilter");

const resetFilters =
    document.getElementById("resetFilters");

const documentTableBody =
    document.getElementById("documentTableBody");

const emptyState =
    document.getElementById("emptyState");

const resultCount =
    document.getElementById("resultCount");

const activeSearch =
    document.getElementById("activeSearch");

const reloadJsonButton =
    document.getElementById("reloadJsonButton");



/* =========================================================
   FILE INPUT
========================================================= */

jsonFile.addEventListener(
    "change",
    function (event) {

        const file =
            event.target.files[0];

        if (file) {

            loadJsonFile(file);
        }
    }
);



/* =========================================================
   DRAG & DROP
========================================================= */

dropZone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropZone.classList.add(
            "drag-over"
        );
    }
);


dropZone.addEventListener(
    "dragleave",
    function () {

        dropZone.classList.remove(
            "drag-over"
        );
    }
);


dropZone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropZone.classList.remove(
            "drag-over"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        if (
            !file.name
                .toLowerCase()
                .endsWith(".json")
        ) {

            showLoaderError(
                "Please select a JSON file."
            );

            return;
        }


        loadJsonFile(file);
    }
);



/* =========================================================
   LOAD JSON FILE
========================================================= */

function loadJsonFile(file) {

    clearLoaderError();


    fileName.textContent =
        "Selected: " + file.name;


    const reader =
        new FileReader();


    reader.onload =
        function (event) {

            try {

                const json =
                    JSON.parse(
                        event.target.result
                    );


                processJsonData(json);


            }
            catch (error) {

                showLoaderError(
                    "Unable to read JSON file. Please check the file format."
                );

                console.error(
                    error
                );
            }
        };


    reader.onerror =
        function () {

            showLoaderError(
                "Unable to open the selected file."
            );
        };


    reader.readAsText(file);
}



/* =========================================================
   PROCESS JSON
========================================================= */

function processJsonData(json) {


    /*
       JSON can be either:

       [
           {...},
           {...}
       ]

       or a single object.
    */


    let documents;


    if (Array.isArray(json)) {

        documents = json;

    }
    else {

        documents = [json];
    }


    /*
       Remove records where:

       DocumentType = null
       DocumentType = ""
       DocumentType = "null"
    */


    allDocuments =
        documents.filter(
            function (doc) {

                const type =
                    doc.DocumentType;


                if (
                    type === null ||
                    type === undefined
                ) {

                    return false;
                }


                const normalized =
                    String(type)
                        .trim()
                        .toLowerCase();


                if (
                    normalized === "" ||
                    normalized === "null"
                ) {

                    return false;
                }


                return true;
            }
        );


    /*
       Normalize document objects.
    */


    allDocuments =
        allDocuments.map(
            function (doc) {

                return {

                    DocumentType:
                        safeValue(
                            doc.DocumentType
                        ),

                    DepAcronym:
                        safeValue(
                            doc.DepAcronym
                        ),

                    DocumentNo:
                        safeValue(
                            doc.DocumentNo
                        ),

                    DocumentTitle:
                        safeValue(
                            doc.DocumentTitle
                        ),

                    RevNo:
                        safeValue(
                            doc.RevNo
                        ),

                    LatestReleaseDate:
                        safeValue(
                            doc.LatestReleaseDate
                        ),

                    PIC:
                        safeValue(
                            doc.PIC
                        ),

                    Hyperlink:
                        safeValue(
                            doc.Hyperlink
                        )
                };
            }
        );


    /*
       Sort by Document No.
    */


    allDocuments.sort(
        function (a, b) {

            return a.DocumentNo.localeCompare(
                b.DocumentNo,
                undefined,
                {
                    numeric: true,
                    sensitivity: "base"
                }
            );
        }
    );


    /*
       Build filters.
    */

    populateFilters();


    /*
       Show finder.
    */

    loaderPage.classList.add(
        "hidden"
    );

    finderPage.classList.remove(
        "hidden"
    );


    /*
       Initial render.
    */

    applyFilters();
}



/* =========================================================
   SAFE VALUE
========================================================= */

function safeValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value).trim();
}



/* =========================================================
   POPULATE FILTERS
========================================================= */

function populateFilters() {


    /* -----------------------------------------
       Document Type
    ----------------------------------------- */

    const types =
        [
            ...new Set(
                allDocuments
                    .map(
                        doc =>
                            doc.DocumentType
                    )
                    .filter(
                        value =>
                            value !== ""
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );


    documentTypeFilter.innerHTML =
        `
        <option value="">
            All Document Types
        </option>
        `;


    types.forEach(
        function (type) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                type;


            option.textContent =
                type;


            documentTypeFilter.appendChild(
                option
            );
        }
    );



    /* -----------------------------------------
       Department
    ----------------------------------------- */

    const departments =
        [
            ...new Set(
                allDocuments
                    .map(
                        doc =>
                            doc.DepAcronym
                    )
                    .filter(
                        value =>
                            value !== ""
                    )
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    {
                        sensitivity: "base"
                    }
                )
        );


    departmentFilter.innerHTML =
        `
        <option value="">
            All Departments
        </option>
        `;


    departments.forEach(
        function (department) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                department;


            option.textContent =
                department;


            departmentFilter.appendChild(
                option
            );
        }
    );
}



/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    function () {

        updateSearchButton();

        applyFilters();
    }
);



/* =========================================================
   CLEAR SEARCH
========================================================= */

clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        updateSearchButton();

        applyFilters();

        searchInput.focus();
    }
);



/* =========================================================
   UPDATE CLEAR BUTTON
========================================================= */

function updateSearchButton() {

    if (
        searchInput.value.trim() !== ""
    ) {

        clearSearch.classList.add(
            "visible"
        );

    }
    else {

        clearSearch.classList.remove(
            "visible"
        );
    }
}



/* =========================================================
   FILTER EVENTS
========================================================= */

documentTypeFilter.addEventListener(
    "change",
    applyFilters
);


departmentFilter.addEventListener(
    "change",
    applyFilters
);



/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedType =
        documentTypeFilter.value
            .trim()
            .toLowerCase();


    const selectedDepartment =
        departmentFilter.value
            .trim()
            .toLowerCase();



    /*
       Split search into individual words.

       Example:

       "quality procedure"

       becomes:

       ["quality", "procedure"]
    */


    const searchTerms =
        searchText === ""
            ? []
            : searchText
                .split(/\s+/)
                .filter(
                    term =>
                        term !== ""
                );



    filteredDocuments =
        allDocuments.filter(
            function (doc) {


                /* -----------------------------------------
                   FILTER DOCUMENT TYPE
                ----------------------------------------- */

                if (
                    selectedType !== "" &&
                    doc.DocumentType
                        .toLowerCase() !==
                    selectedType
                ) {

                    return false;
                }



                /* -----------------------------------------
                   FILTER DEPARTMENT
                ----------------------------------------- */

                if (
                    selectedDepartment !== "" &&
                    doc.DepAcronym
                        .toLowerCase() !==
                    selectedDepartment
                ) {

                    return false;
                }



                /* -----------------------------------------
                   GLOBAL SEARCH
                ----------------------------------------- */

                if (
                    searchTerms.length === 0
                ) {

                    return true;
                }



                /*
                   Search all visible fields.

                   SourceFile is intentionally excluded.

                   Hyperlink is also excluded because
                   it is not useful for keyword searching.
                */


                const searchableText = [

                    doc.DocumentType,

                    doc.DepAcronym,

                    doc.DocumentNo,

                    doc.DocumentTitle,

                    doc.RevNo,

                    doc.LatestReleaseDate,

                    formatDate(
                        doc.LatestReleaseDate
                    ),

                    doc.PIC

                ]
                .join(" ")
                .toLowerCase();



                /*
                   Every search term must exist
                   somewhere in the combined fields.

                   Example:

                   "qa procedure"

                   QA can be in DepAcronym
                   procedure can be in DocumentTitle

                   => MATCH
                */


                return searchTerms.every(
                    function (term) {

                        return searchableText
                            .includes(term);
                    }
                );
            }
        );


    renderTable();

    updateResultHeader();
}



/* =========================================================
   RENDER TABLE
========================================================= */

function renderTable() {


    documentTableBody.innerHTML = "";


    if (
        filteredDocuments.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );



    filteredDocuments.forEach(
        function (doc) {


            const tr =
                document.createElement(
                    "tr"
                );


            /* -----------------------------------------
               Document Type
            ----------------------------------------- */

            const typeTd =
                document.createElement(
                    "td"
                );


            const typeBadge =
                document.createElement(
                    "span"
                );


            typeBadge.className =
                "type-badge";


            typeBadge.textContent =
                doc.DocumentType;


            typeTd.appendChild(
                typeBadge
            );


            tr.appendChild(
                typeTd
            );



            /* -----------------------------------------
               Department
            ----------------------------------------- */

            const deptTd =
                document.createElement(
                    "td"
                );


            const deptBadge =
                document.createElement(
                    "span"
                );


            deptBadge.className =
                "department-badge";


            deptBadge.textContent =
                doc.DepAcronym || "-";


            deptTd.appendChild(
                deptBadge
            );


            tr.appendChild(
                deptTd
            );



            /* -----------------------------------------
               Document Number
            ----------------------------------------- */

            const documentTd =
                document.createElement(
                    "td"
                );


            if (
                doc.Hyperlink !== ""
            ) {


                const link =
                    document.createElement(
                        "a"
                    );


                link.className =
                    "document-link";


                link.textContent =
                    doc.DocumentNo || "-";


                link.href =
                    convertToBrowserPath(
                        doc.Hyperlink
                    );


                link.target =
                    "_blank";


                link.rel =
                    "noopener";


                documentTd.appendChild(
                    link
                );

            }
            else {

                documentTd.textContent =
                    doc.DocumentNo || "-";
            }


            tr.appendChild(
                documentTd
            );



            /* -----------------------------------------
               Document Title
            ----------------------------------------- */

            const titleTd =
                document.createElement(
                    "td"
                );


            titleTd.textContent =
                doc.DocumentTitle || "-";


            titleTd.title =
                doc.DocumentTitle || "";


            tr.appendChild(
                titleTd
            );



            /* -----------------------------------------
               Revision
            ----------------------------------------- */

            const revisionTd =
                document.createElement(
                    "td"
                );


            const revisionBadge =
                document.createElement(
                    "span"
                );


            revisionBadge.className =
                "revision-badge";


            revisionBadge.textContent =
                doc.RevNo || "-";


            revisionTd.appendChild(
                revisionBadge
            );


            tr.appendChild(
                revisionTd
            );



            /* -----------------------------------------
               Latest Release Date
            ----------------------------------------- */

            const dateTd =
                document.createElement(
                    "td"
                );


            dateTd.className =
                "date-cell";


            dateTd.textContent =
                formatDate(
                    doc.LatestReleaseDate
                );


            tr.appendChild(
                dateTd
            );



            /* -----------------------------------------
               PIC
            ----------------------------------------- */

            const picTd =
                document.createElement(
                    "td"
                );


            picTd.textContent =
                doc.PIC || "-";


            tr.appendChild(
                picTd
            );



            /* -----------------------------------------
               ADD ROW
            ----------------------------------------- */

            documentTableBody.appendChild(
                tr
            );
        }
    );
}



/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(value) {


    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        return "-";
    }


    const raw =
        String(value).trim();


    /*
       Handle Excel serial date.

       Example:
       45800
    */


    if (
        /^\d+(\.\d+)?$/.test(raw)
    ) {

        const serial =
            Number(raw);


        /*
           Excel epoch:
           1899-12-30
        */


        const excelEpoch =
            new Date(
                Date.UTC(
                    1899,
                    11,
                    30
                )
            );


        const date =
            new Date(
                excelEpoch.getTime() +
                serial *
                86400000
            );


        return formatDateObject(
            date
        );
    }



    /*
       Handle common date formats:

       2026-08-27
       2026/08/27
       08/27/2026
       27/08/2026
    */


    let date =
        new Date(raw);


    if (
        !isNaN(
            date.getTime()
        )
    ) {

        return formatDateObject(
            date
        );
    }



    /*
       Try yyyy/mm/dd manually
    */

    const match =
        raw.match(
            /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
        );


    if (match) {

        const year =
            Number(match[1]);

        const month =
            Number(match[2]) - 1;

        const day =
            Number(match[3]);


        date =
            new Date(
                year,
                month,
                day
            );


        return formatDateObject(
            date
        );
    }


    /*
       If date cannot be parsed,
       return original value.
    */

    return raw;
}



/* =========================================================
   FORMAT DATE OBJECT
========================================================= */

function formatDateObject(date) {


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return "-";
    }


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const months = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];


    const month =
        months[
            date.getMonth()
        ];


    const year =
        date.getFullYear();


    return `${day}-${month}-${year}`;
}



/* =========================================================
   CONVERT UNC PATH TO BROWSER PATH
========================================================= */

function convertToBrowserPath(path) {


    if (!path) {
        return "";
    }


    path =
        String(path).trim();


    /*
       Already URL
    */

    if (
        /^https?:\/\//i.test(path) ||
        /^file:\/\//i.test(path)
    ) {

        return path;
    }


    /*
       UNC path:

       \\192.168.100.201\Online_Document\Quality Procedure\...

       Convert to:

       file://192.168.100.201/Online_Document/Quality%20Procedure/...
    */


    if (
        path.startsWith("\\\\")
    ) {


        let unc =
            path.substring(2);


        unc =
            unc.replace(
                /\\/g,
                "/"
            );


        /*
           Encode spaces and special characters
           without encoding the slash.
        */

        const parts =
            unc.split("/");


        const host =
            parts.shift();


        const encodedPath =
            parts
                .map(
                    part =>
                        encodeURIComponent(
                            part
                        )
                )
                .join("/");


        return (
            "file://" +
            host +
            "/" +
            encodedPath
        );
    }


    /*
       Windows local path:

       C:\Folder\File.xlsx
    */

    if (
        /^[A-Za-z]:\\/.test(path)
    ) {

        return (
            "file:///" +
            path
                .replace(
                    /\\/g,
                    "/"
                )
                .split("/")
                .map(
                    (part, index) =>
                        index === 0
                            ? part
                            : encodeURIComponent(part)
                )
                .join("/")
        );
    }


    return path;
}



/* =========================================================
   RESULT HEADER
========================================================= */

function updateResultHeader() {


    resultCount.textContent =
        filteredDocuments.length;


    const search =
        searchInput.value.trim();


    const type =
        documentTypeFilter.value;


    const department =
        departmentFilter.value;


    const activeFilters = [];


    if (search !== "") {

        activeFilters.push(
            `Search: "${search}"`
        );
    }


    if (type !== "") {

        activeFilters.push(
            `Type: ${type}`
        );
    }


    if (department !== "") {

        activeFilters.push(
            `Dept: ${department}`
        );
    }


    activeSearch.textContent =
        activeFilters.join(
            "  •  "
        );
}



/* =========================================================
   RESET FILTERS
========================================================= */

resetFilters.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        documentTypeFilter.value = "";

        departmentFilter.value = "";

        updateSearchButton();

        applyFilters();
    }
);



/* =========================================================
   LOAD NEW JSON
========================================================= */

reloadJsonButton.addEventListener(
    "click",
    function () {

        /*
           Return to loader page.
        */

        finderPage.classList.add(
            "hidden"
        );

        loaderPage.classList.remove(
            "hidden"
        );


        /*
           Reset file input.
        */

        jsonFile.value = "";

        fileName.textContent = "";

        clearLoaderError();
    }
);



/* =========================================================
   ERROR FUNCTIONS
========================================================= */

function showLoaderError(message) {

    loaderError.textContent =
        message;
}


function clearLoaderError() {

    loaderError.textContent =
        "";
}