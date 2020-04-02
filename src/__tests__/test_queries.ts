import { structuredData } from "./test_data";
import {QueryGetAll, QueryWith, queryAnnotated, QueryOption} from "../queries";
import {Annotation, GeneIndex} from "../ingest";

describe("Annotation queries", () => {

  it("should return all annotations and genes that appear in them with FilterGetAll", () => {
    const query: QueryGetAll = { tag: "QueryGetAll" };

    const expectedGeneIndex: GeneIndex = Object.entries(structuredData.genes.index)
      // There is a specific gene which does not belong to any annotations called ATBLAHBLAH.
      // This query should have all of the genes except that one.
      .filter(([geneId, _]) => geneId !== "ATBLAHBLAH")
      .reduce((acc, [geneId, value]) => {
        acc[geneId] = value;
        return acc;
      }, {});

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(structuredData.annotations.records);
  });

  it("should choose the proper subset for FilterWith:union for C:KNOWN_EXP", () => {
    const query: QueryWith = { tag: "QueryWith",
      filter: "all",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_EXP" }],
    };

    const expectedGeneIndex: GeneIndex = {
      AT4G18120: {
        gene: {
          GeneID: "AT4G18120",
          GeneProductType: "pseudogene"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:2117706',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005634',
            Reference: 'TAIR:Publication:501713238|PMID:15356386',
            EvidenceCode: 'IDA',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [
              'AT4G18120',
              'AML3',
              'ML3',
              'MEI2-like 3',
              'F15J5.90',
              'F15J5_90'
            ],
            UniqueGeneName: 'AT4G18120',
            AlternativeGeneName: [
              'AT4G18120',
              'AML3',
              'ML3',
              'MEI2-like 3',
              'F15J5.90',
              'F15J5_90'
            ],
            GeneProductType: 'pseudogene',
            Taxon: '',
            Date: "2006-05-19T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_EXP',
            AnnotationExtension: '',
            GeneProductFormID: '' }
        ])
      },
    };

    const expectedAnnotations: Annotation[] = [
      { Db: '',
        DatabaseID: 'locus:2117706',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005634',
        Reference: 'TAIR:Publication:501713238|PMID:15356386',
        EvidenceCode: 'IDA',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [
          'AT4G18120',
          'AML3',
          'ML3',
          'MEI2-like 3',
          'F15J5.90',
          'F15J5_90'
        ],
        UniqueGeneName: 'AT4G18120',
        AlternativeGeneName: [
          'AT4G18120',
          'AML3',
          'ML3',
          'MEI2-like 3',
          'F15J5.90',
          'F15J5_90'
        ],
        GeneProductType: 'pseudogene',
        Taxon: '',
        Date: "2006-05-19T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_EXP',
        AnnotationExtension: '',
        GeneProductFormID: '' }
    ];

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(expectedAnnotations);
  });

  it("should choose a proper subset for FilterWith:union for C:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      filter: "all",
      strategy: "union",
      segments: [{ aspect: "C", annotationStatus: "KNOWN_OTHER" }],
    };

    const expectedGeneIndex: GeneIndex = {
      AT1G09440: {
        gene: {
          GeneID: "AT1G09440",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:2012325',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [ 'AT1G09440', 'AT1G09440.2' ],
            UniqueGeneName: '',
            AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:1005716736',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
          { Db: '',
            DatabaseID: 'locus:1111111111',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
    };

    const expectedAnnotations: Annotation[] = [
      { Db: '',
        DatabaseID: 'locus:2012325',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [ 'AT1G09440', 'AT1G09440.2' ],
        UniqueGeneName: '',
        AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:1005716736',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
    ];

    const queryResult = queryAnnotated(structuredData, query);
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(expectedAnnotations);
  });

  it("should return the union of results when using FilterWith:union for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryWith = { tag: "QueryWith",
      filter: "all",
      strategy: "union",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneIndex: GeneIndex = {
      AT1G09440: {
        gene: {
          GeneID: "AT1G09440",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:2012325',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [ 'AT1G09440', 'AT1G09440.2' ],
            UniqueGeneName: '',
            AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:1005716736',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
          { Db: '',
            DatabaseID: 'locus:1111111111',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT5G40395: {
        gene: {
          GeneID: "AT5G40395",
          GeneProductType: "small_nuclear_rna"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:1005716828',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0000398',
            Reference: 'TAIR:Publication:501682431',
            EvidenceCode: 'TAS',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            GeneNames: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
            UniqueGeneName: 'AT5G40395',
            AlternativeGeneName: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
            GeneProductType: 'snRNA',
            Taxon: '',
            Date: "2006-02-07T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT5G46315: {
        gene: {
          GeneID: "AT5G46315",
          GeneProductType: "small_nuclear_rna"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:1005716827',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0000398',
            Reference: 'TAIR:Publication:501682431',
            EvidenceCode: 'TAS',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            GeneNames: [
              'AT5G46315',
              'U6-29',
              'U6 small nucleolar RNA29',
              '67796.snRNA00001'
            ],
            UniqueGeneName: 'AT5G46315',
            AlternativeGeneName: [
              'AT5G46315',
              'U6-29',
              'U6 small nucleolar RNA29',
              '67796.snRNA00001'
            ],
            GeneProductType: 'snRNA',
            Taxon: '',
            Date: "2006-02-07T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT1G67070: {
        gene: {
          GeneID: "AT1G67070",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:2019748',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0000032',
            Reference: 'TAIR:Communication:501741973',
            EvidenceCode: 'IBA',
            AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
            Aspect: 'P',
            GeneNames: [
              'AT1G67070',
              'DIN9',
              'PMI2',
              'DARK INDUCIBLE 9',
              'PHOSPHOMANNOSE ISOMERASE 2',
              'F1O19.12',
              'F1O19_12'
            ],
            UniqueGeneName: 'AT1G67070',
            AlternativeGeneName: [
              'AT1G67070',
              'DIN9',
              'PMI2',
              'DARK INDUCIBLE 9',
              'PHOSPHOMANNOSE ISOMERASE 2',
              'F1O19.12',
              'F1O19_12'
            ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-06-15T00:00:00.000Z",
            AssignedBy: 'GOC',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
      AT3G02570: {
        gene: {
          GeneID: "AT3G02570",
          GeneProductType: "protein_coding"
        },
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:2076864',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0000032',
            Reference: 'TAIR:Communication:501741973',
            EvidenceCode: 'IBA',
            AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
            Aspect: 'P',
            GeneNames: [
              'AT3G02570',
              'MEE31',
              'PMI1',
              'MATERNAL EFFECT EMBRYO ARREST 31',
              'PHOSPHOMANNOSE ISOMERASE 1',
              'F16B3.20',
              'F16B3_20'
            ],
            UniqueGeneName: 'AT3G02570',
            AlternativeGeneName: [
              'AT3G02570',
              'MEE31',
              'PMI1',
              'MATERNAL EFFECT EMBRYO ARREST 31',
              'PHOSPHOMANNOSE ISOMERASE 1',
              'F16B3.20',
              'F16B3_20'
            ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-11-01T00:00:00.000Z",
            AssignedBy: 'GOC',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
    };

    const expectedAnnotations: Annotation[] = [
      { Db: '',
        DatabaseID: 'locus:2012325',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [ 'AT1G09440', 'AT1G09440.2' ],
        UniqueGeneName: '',
        AlternativeGeneName: [ 'AT1G09440', 'AT1G09440.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: ''},
      { Db: '',
        DatabaseID: 'locus:1005716736',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:1005716828',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        GeneNames: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
        UniqueGeneName: 'AT5G40395',
        AlternativeGeneName: [ 'AT5G40395', 'U6acat', '67751.snRNA00001' ],
        GeneProductType: 'snRNA',
        Taxon: '',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:1005716827',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000398',
        Reference: 'TAIR:Publication:501682431',
        EvidenceCode: 'TAS',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        GeneNames: [
          'AT5G46315',
          'U6-29',
          'U6 small nucleolar RNA29',
          '67796.snRNA00001'
        ],
        UniqueGeneName: 'AT5G46315',
        AlternativeGeneName: [
          'AT5G46315',
          'U6-29',
          'U6 small nucleolar RNA29',
          '67796.snRNA00001'
        ],
        GeneProductType: 'snRNA',
        Taxon: '',
        Date: "2006-02-07T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:2019748',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
        Aspect: 'P',
        GeneNames: [
          'AT1G67070',
          'DIN9',
          'PMI2',
          'DARK INDUCIBLE 9',
          'PHOSPHOMANNOSE ISOMERASE 2',
          'F1O19.12',
          'F1O19_12'
        ],
        UniqueGeneName: 'AT1G67070',
        AlternativeGeneName: [
          'AT1G67070',
          'DIN9',
          'PMI2',
          'DARK INDUCIBLE 9',
          'PHOSPHOMANNOSE ISOMERASE 2',
          'F1O19.12',
          'F1O19_12'
        ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-06-15T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:2076864',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0000032',
        Reference: 'TAIR:Communication:501741973',
        EvidenceCode: 'IBA',
        AdditionalEvidence: [ 'PANTHER:PTN000034017', 'SGD:S000000805' ],
        Aspect: 'P',
        GeneNames: [
          'AT3G02570',
          'MEE31',
          'PMI1',
          'MATERNAL EFFECT EMBRYO ARREST 31',
          'PHOSPHOMANNOSE ISOMERASE 1',
          'F16B3.20',
          'F16B3_20'
        ],
        UniqueGeneName: 'AT3G02570',
        AlternativeGeneName: [
          'AT3G02570',
          'MEE31',
          'PMI1',
          'MATERNAL EFFECT EMBRYO ARREST 31',
          'PHOSPHOMANNOSE ISOMERASE 1',
          'F16B3.20',
          'F16B3_20'
        ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-11-01T00:00:00.000Z",
        AssignedBy: 'GOC',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:1111111111',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
    ];

    // Convert annotations lists to Sets in order to compare contents without order.
    const queriedDataset = queryAnnotated(structuredData, query);
    const genes = queriedDataset.genes.index;
    const outputAnnotationsSet = new Set(queriedDataset.annotations.records);
    const expectedAnnotationsSet = new Set(expectedAnnotations);

    expect([genes, outputAnnotationsSet])
      .toEqual([expectedGeneIndex, expectedAnnotationsSet]);
  });

  it("should find a single gene for QueryWith:intersection for C:KNOWN_OTHER,P:KNOWN_OTHER", () => {
    const query: QueryOption = { tag: "QueryWith",
      filter: "all",
      strategy: "intersection",
      segments: [
        { aspect: "C", annotationStatus: "KNOWN_OTHER" },
        { aspect: "P", annotationStatus: "KNOWN_OTHER" },
      ],
    };

    const expectedGeneIndex: GeneIndex = {
      AT1G08845: {
        gene: {
          GeneID: "AT1G08845",
          GeneProductType: "protein_coding"
        },
        // Here, we add two annotations to a single gene that categorize it
        // under two different aspects. This is to test the intersection case.
        annotations: new Set([
          { Db: '',
            DatabaseID: 'locus:1005716736',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'C',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
          { Db: '',
            DatabaseID: 'locus:1111111111',
            DbObjectSymbol: '',
            Invert: false,
            GOTerm: 'GO:0005576',
            Reference: 'TAIR:AnalysisReference:501780126',
            EvidenceCode: 'ISM',
            AdditionalEvidence: [ '' ],
            Aspect: 'P',
            GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
            UniqueGeneName: 'Heartstopper',
            AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
            GeneProductType: 'protein',
            Taxon: '',
            Date: "2018-08-31T00:00:00.000Z",
            AssignedBy: 'TAIR',
            AnnotationStatus: 'KNOWN_OTHER',
            AnnotationExtension: '',
            GeneProductFormID: '' },
        ])
      },
    };

    const queryResult = queryAnnotated(structuredData, query);
    const expectedAnnotations: Annotation[] = [
      { Db: '',
        DatabaseID: 'locus:1005716736',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'C',
        GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
      { Db: '',
        DatabaseID: 'locus:1111111111',
        DbObjectSymbol: '',
        Invert: false,
        GOTerm: 'GO:0005576',
        Reference: 'TAIR:AnalysisReference:501780126',
        EvidenceCode: 'ISM',
        AdditionalEvidence: [ '' ],
        Aspect: 'P',
        GeneNames: [ 'AT1G08845', 'AT1G08845.2' ],
        UniqueGeneName: 'Heartstopper',
        AlternativeGeneName: [ 'AT1G08845', 'AT1G08845.2' ],
        GeneProductType: 'protein',
        Taxon: '',
        Date: "2018-08-31T00:00:00.000Z",
        AssignedBy: 'TAIR',
        AnnotationStatus: 'KNOWN_OTHER',
        AnnotationExtension: '',
        GeneProductFormID: '' },
    ];
    expect(queryResult.genes.index).toEqual(expectedGeneIndex);
    expect(queryResult.annotations.records).toEqual(expectedAnnotations);
  });
});
