# Wulkanizacja Warszawa — plan, bez automatycznej publikacji

Ten dokument nie jest stroną serwisu i nie trafia do sitemap. Nie zawiera zmierzonych pozycji w Google.

## Decyzja

Jedna lokalizacja: Aleja Krakowska 48/52, 02-284 Warszawa (Włochy). Klienci z pozostałych dzielnic i z najbliższych miejscowości przyjeżdżają pod ten adres. Nie tworzymy stron typu „wulkanizacja + dzielnica”. Google traktuje masę niemal identycznych stron lokalnych jako doorway abuse.

## Macierz intencji

| Zapytanie | Strona | Priorytet |
| --- | --- | --- |
| wulkanizacja Warszawa | `/wulkanizacja-warszawa` | P0, hub |
| wymiana opon Warszawa | `/wymiana-opon-warszawa` | P0 |
| wymiana opon cena Warszawa | `/wymiana-opon-warszawa` i `/cennik#price-cat-tires` | P0, bez nowego URL |
| sezonowa wymiana opon Warszawa | `/sezonowa-wymiana-opon-warszawa` | P0 |
| naprawa opon Warszawa / przebicie | `/naprawa-opon-warszawa` | P0 |
| wyważanie kół Warszawa | `/wywazanie-kol-warszawa` | P0, osobna intencja |
| przechowywanie opon | pozycja cennika i akapit na hubie | bez osobnego URL, warunki magazynu niepotwierdzone |
| P1: Włochy, Okęcie, Raków, Ochota, Ursus, Mokotów, Służewiec, Wola, Bemowo | dojazd na hubie i istniejące strony dzielnic | bez nowych URL |
| P2: Ursynów, Śródmieście, Żoliborz, Bielany, Praga, Białołęka, Targówek i reszta Warszawy | te same strony miejskie | bez minut dojazdu |
| P3: Raszyn, Michałowice, Piastów, Pruszków, Janki, Ożarów Mazowiecki | wymienione jako skąd się przyjeżdża | bez minut dojazdu |

Cena promocyjna to `basePrice`. Cena regularna, przekreślona, to `listPrice`. Oba pochodzą z `src/lib/price-list.ts`. Strony nie trzymają własnej kopii kwot.

## Co jest opublikowane, a czego nie wymyślamy

Potwierdzone przez właściciela i wpisane do cennika: drabinka R13–R23, RunFlat +15 zł/koło, przechowywanie opon bez felg 250 zł/sezon, przechowywanie kół na felgach 300 zł/sezon, naprawa przebicia 60 zł. Z Okęcia orientacyjnie około 5 minut — to czas przejazdu, nie gwarancja. Adres, telefon, godziny i parking bez zmian. Komplet zwykle 45–90 minut.

Nie publikujemy jako oferty:

- R24: pozycja zostaje w danych wewnętrznych, bez ceny i bez obietnicy przyjęcia na stronach;
- dopłata za niski profil: kwota 25 zł nie jest potwierdzona, nie ma jej w publicznym cenniku;
- geometria kół.

Do osobnego potwierdzenia, zanim pojawi się to jako obietnica:

- czy R24 realnie wchodzi na maszynę;
- maksymalna szerokość opony i które RunFlat warsztat przyjmuje;
- czas, miejsce i warunki magazynu (ceny sezonu już są);
- minuty dojazdu z Bemowa, Woli, Ursusa, Pruszkowa i pozostałych miejsc;
- osobny cennik SUV, jeśli miałby różnić się od rozmiaru R;
- dopłata za niski profil, jeśli warsztat ją zatwierdzi.

Geometrii kół nie oferujemy. Nie wraca na strony opon.

## Plan treści na 8 tygodni

Nie publikować automatycznie. Każdy tekst powstaje dopiero po akceptacji i tylko jeśli dodaje fakt, którego nie ma na stronie usługi.

1. Sezonowa wymiana: kiedy zapisać się na komplet, bez nowych cen.
2. Jak czytać rozmiar opony i która pozycja cennika go dotyczy.
3. Przebicie a wymiana opony: kiedy naprawa 60 zł nie wystarczy.
4. Dojazd pod Aleję Krakowską od południa i zachodu, wyłącznie z potwierdzonym czasem z Okęcia.
5. RunFlat: dopłata i co klient ma podać przy zapisie.
6. Przechowywanie — dopiero gdy warsztat potwierdzi warunki. Bez potwierdzenia tydzień wypada.
7. Objawy niewyważonego koła i różnica wobec geometrii, której nie robimy.
8. Przegląd zapytań w Search Console i decyzja, czy którykolwiek temat wymaga uzupełnienia istniejącej strony.

## Search Console

Dostęp do Search Console nie jest podłączony do tego środowiska. Poniższe kroki mierzą wynik po wdrożeniu. Nie są wynikiem.

1. Otworzyć usługę zweryfikowaną plikami HTML już obecnymi w serwisie.
2. Skuteczność → strony: `/wulkanizacja-warszawa`, `/wymiana-opon-warszawa`, `/sezonowa-wymiana-opon-warszawa`, `/naprawa-opon-warszawa`, `/wywazanie-kol-warszawa`, `/opony`.
3. Skuteczność → zapytania: `wulkanizacja warszawa`, `wymiana opon warszawa`, `wymiana opon cena`, `sezonowa wymiana opon`, `naprawa opon`, `przebicie opony`, oraz te same z nazwą dzielnicy P1.
4. Zapisać wyświetlenia, kliknięcia, CTR i średnią pozycję dla każdego URL i zapytania. Porównać z liczbą zapisów na wulkanizację, nie z samą liczbą stron w indeksie.
5. Brak liczby bazowej w tym dokumencie jest celowy: nie zgadujemy pozycji sprzed zmiany.
