### This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Try It
[Support Knowledge](https://slavkopar.github.io/support-2025/)

## Available Scripts

In the project directory, you can run:

### `yarn start`
### `yarn run deploy`

## Export Database to JSON
   It is  possibile to export database to JSON format, for integration to the other AI systems

## SupportExt Extension
 Za sada koristite ovo sto šaljem zipovano, pa kad završimo SupportExt onda ćemo da je objavimo\ 
 https://chromewebstore.google.com/search/SupportExt

1. Unzipujte ekstenziju u neki folder
2. Otvorite Google Chrome, kliknite na Extensions, pa odaberete 'Manage Extensions'
3. Uključite 'developer' mode ON
4. Kliknite na 'Load unpacked' i odaberite gore navedeni folder

5. Onda idete u https://mail.google.com/mail
6. Otvorite neki email, i ako se ne pojavi Support ikona uradite 'reload'
7. Kad kliknete na ikonu otvoriće se naša app, koja će 'mail subject' tretirati kao Question

Kad pošaljem novu verziju extenzije, dovoljan je:
1. desni klik na SupportExt, pa odabrati 'Manage extension'
2. onda samo kliknuti na 'reload' ekstenzije
3. Otvorite neki email, pa ako se ne pojavi Support ikona uradite 'reload'


## Dokumentacija (bice bolja, ovo je samo za jutrasnji miting) 

Prvremeno, kad se menja struktura baze, treba prvo obrisati našu staru IndexDB 'SupportKnowledge' bazu, da bi se kreirala nova.\
Dok ste na sajtu https://slavkopar.github.io/support-2025 \
pritisnete **F12** i odaberete **Application**.\
Odaberete **SupportKnowledge** database i kliknete na **Delete Database**

## Dodao sam novu stranicu ChatBotPage
**SupportPage** služi da preko emaila izgrađuje Database\
A **ChatBotPage** služi da omogući klijentu, da lako nađe Answer, te izgrađuje bazu preko komunikacije sa ChatBot-om\
Tu može da se napravi neki Chat Bot.\
Mislim da danas ljudi više postavljaju pitanja, preko **ChatBot-a** nego putem emaila.\
E jebiga za ovaj način trebala bi nam baza na netu, a ne lokalna.

## Svaka kategorija ima Tagove
When we enter question into the AutoSuggest: 'Remote controller doesn't work',\
and category has Variations: ["MTS", "SBB", "A1", "YETTEL"],\
then we inster the following rows into the drop-down\
+ Remote controller doesn't work MTS
+ Remote controller doesn't work SBB
+ Remote controller doesn't work A1
+ Remote controller doesn't work YETTEL
so helpin a clinet to feasier find the answer\

Takođe, ako korisnik kuca neku reč, za koju ne nalazi nijedno pitanje, ali koja se nalazi u nazivu kategorije,\
možemo onda da ubacimo u drop-don listu sva pitanja iz te kategorije.

Bussines logic se preselila u **SupportPage** preko emaila, i **ChatBotPage** preko ChatBot-a, Question/Answers su samo **maintenance** Nisam još počeo da ulazim u ChatBot logiku, ali ovo gore služi da pomogne klijentu da što lakše dođe do  odgovora.

## Ideja

You are software company and You have your software product.\
Your QA people, repeatedly interupt your developers with the same questions.\
Developers need to read documentation or open Visual Studio, investigate code, returning the answer.\
It is very boring an unefficient.

With our  **Support Knowledge** Chrome Extension you can easily build and maintain your Knowledge database.\
Our extension can easily be integrated to all kind of browseres.\
Extension treats email Subject as the Question, and with single click, stores it to the database.\
Extension also eables easy return of the Answer over the email.\
Answer can be chosen from the Answers assigned to that Question .

Of course, you can use one of existing trackers, educate people, \
or even use call center with voice recognition and **AI**, and so on ...\
But it is expensive and overkill.

## Building Chat Bot using **Support Knowledge**

We could develop **Chat Bot** after enabling some structure of the **Support Knowledge Database**, To make logic of conversation, for example using notion of Answers related to some Answer and workflows with logic.\

## Export **Support Knowledge Database** to other JSON formates

The idea is exporting of the **Support Knowledge Database** to the formats, expected from the following sites:\
[Azure Cosmos-DB](https://learn.microsoft.com/en-us/azure/cosmos-db/introduction)\
or\
[Tawk](https://www.tawk.to/software/knowledge-base)\


## Comment: Developers should be aware
   We have, at two places:\
      &lt;EditCategory inLine={true} />\
      &lt;EditCategory inLine={false} />\
   so we execute loadCategoryQuestions() twice in QuestionList, but it is OK