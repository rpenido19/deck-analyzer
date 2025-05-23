$(document).ready(function () {
  loadFiles();
});

let allCards = [];

function loadFiles() {
  const fileNames = ["average.json", "cheap.json", "expensive.json"];
  const cardData = {};

  function processFileData(data) {
    if (
      !data ||
      !data.pageProps?.data?.container?.json_dict?.cardlists?.length
    ) {
      return false;
    }

    data.pageProps.data.container.json_dict.cardlists.forEach((i) => {
      i.cardviews.forEach((card) => {
        const cardName = card.sanitized;

        if (!cardData[cardName]) {
          cardData[cardName] = {
            count: 0,
            details: { ...card },
            header: i.header,
            tag: i.tag,
          };
        }

        cardData[cardName].count += 1;

        if (card.inclusion > cardData[cardName].details.inclusion) {
          cardData[cardName].details = { ...card };
          cardData[cardName].header = i.header;
          cardData[cardName].tag = i.tag;
        }
      });
    });

    return true;
  }

  let filesProcessed = 0;
  let validFiles = 0;

  fileNames.forEach((file) => {
    fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error(`Erro ao carregar o arquivo ${file}`);
        return response.json();
      })
      .then((data) => {
        const processed = processFileData(data);
        if (processed) validFiles += 1;
        filesProcessed += 1;

        if (filesProcessed === fileNames.length) {
          finalizeProcessing(validFiles);
        }
      })
      .catch((error) => {
        console.error("Erro:", error);
        filesProcessed += 1;

        if (filesProcessed === fileNames.length) {
          finalizeProcessing(validFiles);
        }
      });
  });

  function finalizeProcessing(validFiles) {
    if (validFiles === 0) {
      console.warn("Nenhum arquivo válido foi encontrado.");
      return;
    }

    allCards = Object.values(cardData)
      .filter((card) => card.count === validFiles)
      .map((card) => ({
        ...card.details,
        header: card.header,
        tag: card.tag,
      }));

    displayCards(allCards);
  }
}

function displayCards(cards) {
  const tableBody = document.getElementById("cardTableBody");
  tableBody.innerHTML = "";

  switch (document.getElementById("filterSortBy").value) {
    case "Num Decks":
      cards.sort((a, b) => b.num_decks - a.num_decks);
      break;
    case "Inclusion":
      cards.sort(
        (a, b) =>
          b.inclusion / b.potential_decks - a.inclusion / a.potential_decks
      );
      break;
    case "Synergy (%)":
      cards.sort((a, b) => b.synergy - a.synergy);
      break;
    case "Potential Decks":
      cards.sort((a, b) => b.potential_decks - a.potential_decks);
      break;
  }

  const limit = parseInt(document.getElementById("filterLimit").value);
  const limitedCards = isNaN(limit) ? cards : cards.slice(0, limit);

  limitedCards.forEach((card) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${card.name}</td>
      <td>${card.header}</td>
      <td>${card.num_decks}</td>
      <td>${parseFloat((card.inclusion / card.potential_decks) * 100).toFixed(
        2
      )}%</td>
      <td>${card.synergy}%</td>
      <td>${card.potential_decks}</td>
    `;
    tableBody.appendChild(row);
  });

  document.getElementById("table-footer").innerHTML =
    "Total records in the table: " + limitedCards.length;
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
  const potentialDecksFilter = parseInt(
    document.getElementById("filterPotentialDecks").value
  );
  const tagFilter = document.getElementById("filterTag").value;

  const filteredCards = allCards.filter((card) => {
    const passesInclusion =
      isNaN(inclusionFilter) ||
      card.inclusion / card.potential_decks >= inclusionFilter;
    const passesNumDecks =
      isNaN(numDecksFilter) || card.num_decks >= numDecksFilter;
    const passesSynergy = isNaN(synergyFilter) || card.synergy >= synergyFilter;
    const passesPotentialDecks =
      isNaN(potentialDecksFilter) ||
      card.potential_decks >= potentialDecksFilter;

    let passesTag = true;
    if (tagFilter === "NOT Lands") {
      passesTag = !card.header.includes("Lands") && !card.tag.includes("Lands");
    } else if (tagFilter !== "") {
      passesTag =
        card.header.includes(tagFilter) || card.tag.includes(tagFilter);
    }

    return (
      passesInclusion &&
      passesNumDecks &&
      passesSynergy &&
      passesPotentialDecks &&
      passesTag
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
    if (nameCell) cardNames.push("1 " + nameCell.textContent.trim());
  }

  navigator.clipboard
    .writeText(cardNames.join("\n"))
    .then(() =>
      showToast("Nomes das cartas copiados para a área de transferência!")
    )
    .catch((error) => {
      console.error("Erro ao copiar para a área de transferência:", error);
    });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className =
    "toast align-items-center text-bg-success border-0 position-fixed bottom-0 start-0 m-3";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toast.style.zIndex = "1055";
  document.body.appendChild(toast);
  new bootstrap.Toast(toast).show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

function calculateEquation() {
  const manaAverage =
    parseFloat(document.getElementById("manaAverage").value) || 0;
  const cheapSpells =
    parseFloat(document.getElementById("cheapSpells").value) || 0;
  const result = 31.42 + 3.13 * manaAverage - 0.28 * cheapSpells;
  document.getElementById(
    "equationResult"
  ).textContent = `Número de Terrenos: ${result.toFixed(2)}`;
}

var tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]')
);
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});
