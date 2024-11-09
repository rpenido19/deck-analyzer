$(document).ready(function () {
  loadFiles();
});

let allCards = [];

function loadFiles() {
  const fileNames = ["average.json", "cheap.json", "expensive.json"];
  const cardData = {};

  function processFileData(data) {
    data.pageProps.data.container.json_dict.cardlists.forEach((i) => {
      i.cardviews.forEach((card) => {
        const cardName = card.sanitized;

        if (!cardData[cardName]) {
          cardData[cardName] = { count: 0, details: card };
        }

        cardData[cardName].count += 1;

        if (card.inclusion > cardData[cardName].details.inclusion) {
          cardData[cardName].details = card;
        }
      });
    });
  }

  let filesLoaded = 0;
  fileNames.forEach((file) => {
    fetch(file)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao carregar o arquivo JSON.");
        }
        return response.json();
      })
      .then((data) => {
        processFileData(data);
        filesLoaded += 1;

        if (filesLoaded === fileNames.length) {
          allCards = Object.values(cardData)
            .filter((card) => card.count === fileNames.length)
            .map((card) => card.details);

          displayCards(allCards);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
      });
  });
}

function displayCards(cards) {
  const tableBody = document.getElementById("cardTableBody");
  tableBody.innerHTML = "";

  cards.sort((a, b) => b.num_decks - a.num_decks);

  const limit = parseInt(document.getElementById("filterLimit").value);
  const limitedCards = isNaN(limit) ? cards : cards.slice(0, limit);

  limitedCards.forEach((card) => {
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${card.name}</td>
        <td>${card.inclusion}</td>
        <td>${card.num_decks}</td>
        <td>${card.synergy}%</td>
      `;

    tableBody.appendChild(row);
  });

  const tableFooter = document.getElementById("table-footer");
  tableFooter.innerHTML =
    "Total de registros na tabela: " + limitedCards.length;
}

function applyFilters() {
  const inclusionFilter = parseFloat(
    document.getElementById("filterInclusion").value
  );
  const numDecksFilter = parseInt(
    document.getElementById("filterNumDecks").value
  );
  const synergyFilter = parseFloat(
    document.getElementById("filterSynergy").value
  );

  const filteredCards = allCards.filter((card) => {
    return (
      (isNaN(inclusionFilter) || card.inclusion >= inclusionFilter) &&
      (isNaN(numDecksFilter) || card.num_decks >= numDecksFilter) &&
      (isNaN(synergyFilter) || card.synergy >= synergyFilter)
    );
  });

  displayCards(filteredCards);
}

function copyNamesToClipboard() {
  const tableBody = document.getElementById("cardTableBody");
  const rows = tableBody.getElementsByTagName("tr");
  const cardNames = [];

  for (let row of rows) {
    const nameCell = row.cells[0];
    if (nameCell) {
      cardNames.push("1 " + nameCell.textContent.trim());
    }
  }

  const namesText = cardNames.join("\n");

  navigator.clipboard
    .writeText(namesText)
    .then(() => {
      alert("Nomes das cartas copiados para a área de transferência!");
    })
    .catch((error) => {
      console.error("Erro ao copiar para a área de transferência:", error);
    });
}
