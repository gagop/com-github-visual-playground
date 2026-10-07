# Projekt interfejsu

`concept.png` jest referencją wygenerowaną wbudowanym narzędziem ImageGen. Dokładny prompt znajduje się w `concept-prompt.txt`. Obraz nie jest częścią działającego interfejsu — wszystkie kontrolki, teksty i graf są HTML/CSS/SVG.

System wizualny: tło `#f7f8fa`, białe panele `#ffffff`, tekst `#20242b`, akcent `#7161dc`, tree `#df901e`, blob `#098f8e`, obramowania `#e2e5ec`, promień paneli 8 px. Nagłówki i kontrolki używają systemowej czcionki bezszeryfowej, a kod, ścieżki i hashe czcionki monospace. Ikony to lekkie SVG ze spójną grubością linii.

Układ: pasek górny, nagłówek, trzy etapy pracy, następnie lewa kolumna plików i edytora oraz prawa kolumna grafu i inspektora. Na telefonie sekcje układają się pionowo, a graf przewija się w obrębie własnego obszaru, zachowując czytelny rozmiar węzłów.

Wzorce interakcji: dodawanie/wycofywanie pojedynczych zmian, dodawanie wszystkich, commit wiadomości, klikane węzły i odnośniki do obiektów, okna tworzenia i zmiany ścieżek, przełączanie widoków i gałęzi. Delikatne pulsowanie etapu i pojawianie się nowych węzłów wskazują zmiany; preferencja ograniczenia animacji jest respektowana.

Świadome uzupełnienia referencji wymagane do działania: przyciski staging i commit, usuwanie i zmiana ścieżek, nowa gałąź, cofanie i dziennik; pokazanie rzeczywistych hashów, stanów początkowych i indeksu; stała wysokość przewijanego inspektora. Dziennik zastępuje narysowany w referencji terminal. Edytor jest dostępnym polem tekstowym bez zależności; nie wykonuje kodu.
