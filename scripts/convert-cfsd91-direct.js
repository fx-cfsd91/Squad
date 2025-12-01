// Conversion directe des données CFSD91 collées
// Copie tes données Excel ici et exécute le script

const rawData = `Code Adh.	Competiteur	Nom Prénom	H/F	Date de naissance	Adresse	Villes	Age	Mail
11412816K 	oui +	ACHARI STEPHANE	H	24/11/1993	34 rue des 3 Chênes	91800 Brunoy	31	stephane.achari@gmail.com
	OUI	ADJAL  ETHAN	kh	22/02/2016	19 rue de Yerres	94440 VILLECRESNES	9	ing.guerin@gmail.com
11595344K	OK +	ALEXANDRE MAXIME	wh	02/12/2014	2 rue de la justice	91230 MONTGERON	10	lucile.col.249@gmail.com
	OK +	ANNE  MOUTONNET   AMY	kf	14/03/2015	48 rue de le Grange	91330 YERRES	10	stephaniemoutonnet@gmail.com
11480062D	oui +	ANSTETT-BADAS STELLA	F	07/06/2009	1 impasse du moulin 	91330 YERRES	16	chrystel.badas@free.fr
	OK +	BABIN  CLEA	wf	14/02/2011	27 rue de l'Abbaye	91330 YERRES	14	babin.jd@gmail.fr
	OK +	BABIN  LOUIS	wh	19/05/2012	27 rue de l'Abbaye	91330 YERRES	13	babin.jd@gmail.fr
	OUI	BAHEUX  LEONARD	kh	23/11/2017	50 allée des Chevreuils	91330 YERRES	7	atlv.baheux@gmail.fr
10927198P	oui	BARRIOL CEDRIC	H	01/09/2000	9 allée Montaigne	91330 YERRES	25	cedric.barriol91@gmail.com
11690436V	ok +	BAUDIN  THIERRY	H	07/12/1964	8 rue genevieve Plailly	91330 YERRES	60	
11528057W	oui +	BELIN DAVID	H	24/01/1997	9 rue de l'abbé Bellanger	91210 DRAVEIL	28	david.belin23@gmail.fr
11528060A	oui +	BELIN NICOLAS	H	24/01/1997	80 avenue pierre Brossolette	91230 MONTGERON	28	nicolas.belin23@gmail.fr
11506410S	oui	BENFODDA VAN MELLO MAXIME   	H	05/02/2002	22 rue du colchique	91270 VIGNEUX SUR SEINE	23	maximebvm@hotmail.com
11690404L 	OK +	BENICHOU  ERWAN	kh	20/07/2015	8 rue du bois Caillis	91330 YERRES	10	benichou.amel@gmail.com
11690405M	OK +	BENICHOU  NOLAN	kh	20/07/2015	8 rue du bois Caillis	91330 YERRES	10	benichou.amel@gmail.com
11690430P	OK +	BENICHOU  SAMI	H	03/04/1984	8 rue du bois Caillis	91330 YERRES	41	sami.benichou@gmail.com
11595368L	OK +	BERRIER CLEMENT	H	25/04/2007	24 rue francois boucher	91330 YERRES	18	berrierclement77@gmail.com
11690471J	ok +	BERTRAM BOURHOVEN  JULES	H	02/10/2009	4 route de Brie	91800 Brunoy	16	nathalieb500@hotmail.com
11436576L	OK +	BILINSKI NICOLAS	H	02/04/1980	3 rue des Gaulis	91330 YERRES	45	nicolas.bilinski@free.fr
	OK +	BLANC  ELOIZE	wf	21/06/2012	45 rue gabriel peri bat 4	91330 YERRES	13	babethe@wanadoo.fr
11480072P	oui	BOBOVITCH MARC	wh	19/09/2012	6 allée des mesanges	91330 YERRES	13	p.bobovitch@gmail.com
10869929Q	OK +	BOUYE ANTONY	H	22/11/2009	51 rue daniel mayer	91560 CROSNE	15	jennifer.1979@hotmail.fr
09011005V	oui	BRIMEUR Jean-Baptiste	H	04/07/1983	9 avenue charles de gaulle	91800 Boussy st antoine	42	jb198391@gmail.com
	OK +	BRUNET  MARGOT	kf	11/04/2025	5 allee arthur Rimbaud	91330 YERRES	0	brunetjerome63@gmail.com
11690414W	ok +	CABRAL REDJEM  NAËL ZAKARY	wh	04/12/2012	6 rue des Bosquets 	91330 YERRES	12	lys_nour@hotmail.com
10280642L		CARVAJAL F XAVIER	H	13/10/1980	3 allée des uselles	91560 CROSNE	45	fx.cfsd91@hotmail.fr
11534299G	oui	CASELLATO MELANIE	F	13/06/1996	109 rue de Concy	91330 YERRES	29	melaniecasellato@gmail.com
11436258Q	OK +	CHARBONNIER-LIF ERWAN	wh	15/02/2013	16 rue des cottages	91330 YERRES	12	feuste91@gmail.com
11436256N	OK +	CHARBONNIER-LIF MAEL	H	15/10/2010	16 rue des cottages	91330 YERRES	15	feuste91@gmail.com
	OK +	CHAUPEAU  LUCAS	kh	07/08/2015	27 rue des Longaines	91330 YERRES	10	cecilede91@gmail.com
11436259R	oui	CHEA SHAILINA	F	15/10/2008	19 rue du beau Site	91330 YERRES	17	pieng91@yahoo.fr
11436261T	oui	CHEA TALYA	F	15/10/2008	19 rue du beau Site	91330 YERRES	17	xchea1@yahoo.fr
	OK +	CHEVALLIER  CLAIRE	kf	21/06/2015	13 rue léonard de Vinci	91330 YERRES	10	blouarn@yahoo.com
11625505T	OK +	CLERC  ALEXANDRE	H	16/09/2005	11 rue françois Millet	91330 YERRES	20	alex05.clerc@gmail.com
	OK +	CONAN COMBES  OWEN	wh	27/11/2013	53 av du Château	91800 Brunoy	11	sandra.combes12@gmail.com
11480082A	OK +	CORNUAN NATHAN	H	03/04/2008	8 rue paul verlaine	91330 YERRES	17	peggy.cornuau@sncf.fr
11595396R	oui	CORNUAN PEGGY	F	02/11/1973	8 rue paul verlaine	91330 YERRES	52	peggy.cornuau@sncf.fr
11595405B	oui	CRUZ  CELINE	F	21/11/1989	11 av Montaigue	91800 Brunoy	35	cruz.celine@outlook.fr
	OK +	DANILOV  IVAN	H	21/12/2007	1 bis rue commerces	91230 MONTGERON	17	ivandailov365@gmail.com
11625499M	OK +	DANILOV ANDREI	H	13/09/2005	1 bis rue commerces	91230 MONTGERON	20	andreidanilov127@gmail.com
	OK +	DELION  LOEVA	wf	08/01/2014	11 allee bernard de Jussieu	91330 YERRES	11	claireantoine.delion@gmail.com
11595419R	OUI	DEMOUSSEAU  GUNNY  MAHELINE	wh	09/05/2012	42 bis rue des Lievres 	91800 Brunoy	13	debdem@hotmail.fr
10153137T		DEMULIER PASCAL	H	12/09/1973	5 avenue de l'Orangerie	91800 BRUNOY	52	pascal.cfsd@orange.fr
11436264W	ok +	DESMARD LISE	wf	30/09/2012	71 rue de concy	91330 YERRES	13	desmardmathieu@yahoo.fr
11690476P	OK +	DI CARA  LORENZO	H	04/12/2001	14 rue pierre Loti	91330 YERRES	23	lorenzodcara01@gmail.com
	OK +	DIGORI  NIKITA	wh	01/10/2013	2 rue pierre de Coubertin bat n°1	91330 YERRES	12	utica.sanda6666@gmail.com
11500369B	oui	DUFOUR  RENAUD	H	20/11/1976	8 rue de povoa de varzim	91230 MONTGERON	48	reno1921@live.fr
11595467T	oui	DUMAINE ROMEO	H	20/02/2009	80 avenue jean Jaurés	92140 CLAMART	16	samaldo20@gmail.com
11690480T	oui	ERNU  MATTEO	H	07/01/2002	93 bis rue victor Hugo	91210 Draveil	23	matteoe@free.fr
11625513C	oui	ESANU  MARIUS	H	19/12/2002	14 résd du parc des Cascades	91230 MONTGERON	22	mariusesanu98@gmail.com
11595474B	oui	FALET MARC	H	16/07/1982	49 avenue du général leclerc	91330 YERRES	43	marc.falet@hotmail.fr
	OK +	FEKIR  YASMINE	wf	15/02/2012	3 rue du beau Site	91330 YERRES	13	mohsen.daboussi@live.fr
11690410S	ok +	FUCILE  CHARLIE	kh	07/12/2014	76 rue de Jarcy	91480 Quincy sous senart	10	fanny.fucile@gmail.com
11595480H	OK +	GAIL CHRISTINE 	F	11/10/1971	32 boulevard arago	91130 RIS-ORANGIS	54	christine.gail@outlook.fr
10791302B		GAUDAS  JONATHAN	H	22/08/1992	4 rue Balzac	91100 CORBEIL	33	jonathan91210@hotmail.fr
11690406N	OK +	GONET  NATHAN	wh	02/11/2014	5 rue pierre Loti	91330 YERRES	11	ladalolo91@gmail.com
11311900T	oui	GONZALO ANTHONY	H	02/05/1997	8 rue des anemones	91210 DRAVEIL	28	gonzalo.antholy91210@gmail.com
11690426K	OK +	GUNNY  REHAZE	H	01/05/1978	42 bis rue des Lievres 	91800 Brunoy	47	debdem@hotmail.fr
11690454Q	oui	HENRY  ELIOTTE	H	18/11/1992	42 resd la Champagne	94520 Périgny sur Yerres	32	eliotte.henry.pro@gmail.com
11440654T	oui	HOUPLAIN  ETHAN	wh	02/03/2012	24 rue du Réveillon	91330 YERRES	13	annie-fouksmann@gmail.com
11515070F	oui	KARIMOU MOLA SAID	H	09/09/1999	2 place du marche	91330 YERRES	26	saidkarimou3@gmail.com
11366041S	oui	LABBE BOTINEAU  AURELIEN	wh	22/07/2012	9 allée montaigne	91330 YERRES	13	cedric.barriol91@gmail.com
	OK +	LAGUERRE  RAFFAELE	kh	12/04/2017	36 bis avenue Pasteur	91330 YERRES	8	kat974@hotmail.com
11595507M	oui	LARDON IHSAN-LOUIS 	wh	21/11/2014	19 avenue gourgaud 	91330 YERRES	10	christopheflorian@gmail.com
11211363P	OK +	LAURENT RAPHAEL 	H	09/05/2009	11 rue kleber	91800 BRUNOY	16	meclau@free.fr
11595781K	oui	LE SOURNE ARNAUD	H	31/07/1977	13 residence de l'ermitage de senart 	91330 YERRES	48	alsuno@hotmail.fr
11767497H	OK +	LEMEE  DAMIEN	H	05/05/2004	38 rue Germaine	91330 YERRES	21	lemeedamien05@gmail.com
	OK +	LEMEE  SALOME	F	23/01/2009	38 rue Germaine	91330 YERRES	16	lemeedamien05@gmail.com
10535346N		LEPAGE ERIC	H	19/06/1972	77 avenue pierre brosselette	91230 MONTGERON	53	eric.lepage@mutualite.fr
11035594L		LEPAGE ESTEBAN	H	12/09/2003	2 rue pierre de coubertin	91330 YERRES	22	00esteban00@free.fr
11690417A	oui	LESNIC  SEBASTIAN	wh	09/01/2013	18 rue Sisley	91330 YERRES	12	marieta.lesnic87@gmail.com
01195797E	OK +	LING SYLVAIN	H	08/01/1979	49 rue corneille	91330 YERRES	46	s.ling@free.fr
11436597J	OK +	LONGUEVILLE  ROBIN	kh	08/01/2015	21 rue Germaine	91330 YERRES	10	manon.nicolle@hotmail.fr
	OUI	LUKIC  DANICA	kf	26/07/2015	34 rue Corneille	91330 YERRES	10	lukiczoran@hotmail.fr
11480170V	oui	MANLIUS BRICE	H	23/03/1984	13 impasse de la clepsydre	77127 LIEUSAINT 	41	brice_manlius@hotmail.fr
11216480B	oui	MANLIUS NATI	H	05/09/2007	30 rue des Alisiers	77000 PONTHIERRY	18	tristan.manlius@gmail.com
10235676K	oui	MANLIUS TRISTAN	H	22/08/1979	30 rue des Alisiers	77000 PONTHIERRY	46	tristan.manlius@gmail.com
11595796B	OK +	MARMARA SIXTINE	wf	01/02/2014	94 rue rené coty	91330 YERRES	11	julie.cotentin@gmail.com
11035728G	OK +	MESLIER ELEONORE	F	23/06/1984	44 rue pierre Loti	91330 YERRES	41	eleonoremeslier@gmail.com
	OUI	MOGENTALE  ANGELO	H	22/01/2010	58 rue jules Verne	91270 Vigneux sur seine	15	mogentale.boris@gmail.com
10299651X		MONPIERRE   MATHIEU	H	10/01/1984	"14 Rue Jules Ferry
Apt. 401"	77360 VAIRES SUR MARNE	41	mathieu.monpierre@gmail.com
	OUI	PEDRON  ELIAZ	kh	30/01/2018	1 allée du pré de Lucie	91330 YERRES	7	stephane17p@gmail.com
	OUI	PEDRON  JOHAN	kh	05/03/2015	1 allée du pré de Lucie	91330 YERRES	10	stephane17p@gmail.com
11595870G	OK +	PERRET NICOLAS	H	16/03/1977	12 rue des beautes	91560 CROSNE	48	perret-nicolas@hotmail.fr
	OK +	PERRSSIN FABENT  BENOIT	H	11/07/2005	17 av Pasteur	91330 YERRES	20	benoitperrissin91@gmail.com
11436603Q	OK +	PORTIN ARTHUR	wh	19/08/2014	9 rue auguste renoir	91330 YERRES	11	kevin.portin@gmail.com
01193795D	OK +	POULAIN CEDRIC	H	03/08/1978	18 rue du beau site	91330 YERRES	47	cedric.poulain@neuf.fr
	OK +	PRIPA  VICTOR	wh	23/06/2013	41 av de la Faisanderie	91800 Brunoy	12	ebdd03@gmail.com
11690413V	OUI	RASTELLO  EDEN	kh	27/05/2016	63 rue françois Rakoczi	91330 YERRES	9	sebastos11@hotmail.com
11480130C	OK +	REIMANN FASOLI TIMAEL	wh	22/04/2014	14 allée des prévots	91560 CROSNE	11	sophia.fasoli@gmail.com
11120413F	oui	ROBERT MICHAEL	H	24/12/1973	18 allée francis Carco	91330 YERRES	51	micaste@hotmail.fr
11462400F	oui	SCANLON JOHAN	wh	25/04/2013	37 rue de frederic mistral	91330 YERRES	12	matthieu.scanlon@gmail.com
11035732L	OK +	STADTMULLER MATHIEU	H	15/05/1988	94 rue parmentier	94460 VALENTON	37	risk.91@hotmail.com
11480133F	OK +	STURM BCHINI ELYES	wh	07/05/2013	34 rue du viaduc	91330 YERRES	12	sturm.bchini@outlook.com
11215306A	OK +	TEK MATHIEU 	H	22/01/1990	27 avenue gallieni 	91800 BRUNOY	35	mathieu.tek@gmail.com
	OUI	TETUAN  LEA	kf		21 av du Sauvageon	91800 Brunoy	125	celinetetuan@gmail.com
11436615D	OK +	TETUAN GERARD	H	18/05/1965	21 av du Sauvageon	91800 BRUNOY	60	gerard.tetuan@gmail.com
11436606T	OK +	THABTHIM TANUSORN PAM	wh	12/06/2012	9 rue auguste renoir	91330 YERRES	13	kevin.portin@gmail.com
10931532A	OUI 	THIBEAUD SEBASTIEN	H	01/02/1980	13 rue cambrelang	91330 YERRES	45	st.ecom@live.fr
11480142Q	OK +	VALENTE TIZIANO	wh	29/08/2015	12 rue du maréchal Foch	91330 YERRES	10	stefanok09@gmail.com
10943076X	OK +	VALETTE  HUGO	H	23/12/2009	9 rue du maréchal Ney	91860 Epinay sous senart	15	
10768238G	OK +	VOISIN CHRISTOPHE	H	15/05/1971	4 Residence de la grande prairie	91330 YERRES	54	chris-voisin@orange.fr
11436607U	OK +	VOISIN CLARA	F	12/01/2010	5 Residence de la grande prairie	91330 YERRES	15	chris-voisin@orange.fr
11436616E	oui	ZHU YIWEN	H	01/02/1997	1 C avenue de la Chesnaie	77380 Combs la ville	28	yiwen94100@gmail.com
11595917H	oui	ZITOUNI MEDHI 	H	04/12/2006	14 rues des chenes	94190 VILLENEUVE SAINT GEORGES	18	mzbzitouni@gmail.com
10783113A	OK +	ZONGO ALVIN LANDRY	H	05/04/1999	2 rue pierre de coubertin	91330 YERRES	26	alvinzongo@protonmail.com
11690438X	OK +	ZOPKE  GREGORY	H	04/08/1992	2 rue thiroux d'Arconville	91560 Crosne	33	greg.guit@gmail.com`;

function convertCFSD91Data() {
    console.log("🥋 Conversion des données CFSD91...");
    
    const lines = rawData.trim().split('\n');
    const headers = lines[0].split('\t');
    const dataLines = lines.slice(1);
    
    const eleves = [];
    let index = 0;
    
    dataLines.forEach((line, lineIndex) => {
        const columns = line.split('\t');
        
        // Ignorer les lignes vides ou sans nom
        if (!columns[2] || columns[2].trim() === '') {
            return;
        }
        
        // Mapping des disciplines selon codes CFSD91
        const competiteur = columns[1];
        let discipline = "MMA"; // Par défaut
        
        if (competiteur.includes('k')) {
            discipline = "Krav-Maga";
        }
        
        // Déterminer le genre
        const hf = columns[3];
        let genre = "H";
        if (hf === "F") genre = "F";
        else if (hf === "kh" || hf === "wh") genre = "M"; // enfant masculin
        else if (hf === "kf" || hf === "wf") genre = "F"; // enfant féminin
        
        // Séparer nom et prénom
        const nomPrenom = columns[2].trim();
        const parts = nomPrenom.split(/\s+/);
        const nom = parts[0];
        const prenom = parts.slice(1).join(' ');
        
        // Combattant si "+" ou "oui" ou "OUI"
        const combattant = competiteur.includes('+') || 
                          competiteur.toLowerCase().includes('oui');
        
        const eleve = {
            id: `eleve_cfsd91_${(index + 1).toString().padStart(3, '0')}`,
            nom: nom,
            prenom: prenom,
            naissance: columns[4] || "",
            jour: "",
            discipline: discipline,
            combattant: combattant,
            etudiant: false,
            renouvellement: false,
            telUrgence: "",
            telEleve: "",
            email: columns[8] || "",
            adresse: `${columns[5] || ""}, ${columns[6] || ""}`.replace(', ,', ''),
            ville: columns[6] || "",
            licence: columns[0] || "",
            genre: genre,
            age: parseInt(columns[7]) || 0,
            ceinture: "",
            photo: "",
            createdAt: new Date().toISOString()
        };
        
        eleves.push(eleve);
        index++;
    });
    
    console.log(`✅ ${eleves.length} élèves convertis`);
    
    // Statistiques
    const stats = {
        MMA: eleves.filter(e => e.discipline === "MMA").length,
        "Krav-Maga": eleves.filter(e => e.discipline === "Krav-Maga").length,
        Hommes: eleves.filter(e => e.genre === "H").length,
        Femmes: eleves.filter(e => e.genre === "F").length,
        Enfants: eleves.filter(e => e.genre === "M" || (e.genre === "F" && e.age < 18)).length,
        Combattants: eleves.filter(e => e.combattant).length
    };
    
    console.log("📊 Statistiques:", stats);
    
    // Retourner le JSON
    return JSON.stringify(eleves, null, 2);
}

// Exécution
const jsonResult = convertCFSD91Data();
console.log("🎯 Données converties ! Copie le JSON ci-dessous :");
console.log(jsonResult);