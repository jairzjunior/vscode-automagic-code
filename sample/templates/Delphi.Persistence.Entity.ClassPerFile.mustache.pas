{{#tables}}
unit Persistence.Entity.{{entity_name}};

interface

uses
  System.Classes,
  Spring,
  Spring.Persistence.Mapping.Attributes,
  Persistence.Consts;

type
  TCommon{{entity_name}} = class(TObject)
  strict private{{#colunas}}
    F{{attribute_name}}: {{data_type}};{{/colunas}}
  protected{{#colunas}}
    property {{attribute_name}}: {{data_type}} read F{{attribute_name}} write F{{attribute_name}};{{/colunas}}
  end;

  [Entity]
  [Table({{table_name_const}}, {{table_schema_const}})]{{#sequences}}
  [Sequence({{sequence_name_const}}, 1, 1)] {{/sequences}}
  T{{entity_name}} = class(TCommon{{entity_name}})
  public{{#colunas}}
    {{#-first}}[AutoGenerated]{{/-first}}
    [Column({{column_name_const}}, [{{#-first}}cpPrimaryKey{{/-first}}{{^is_nullable}}cpRequired{{/is_nullable}}]{{#size}}, {{size}}{{/size}})]
    property {{attribute_name}};{{/colunas}}
  end;

implementation

end.

---<EOF: {"nameFile": "{{entity_name}}.pas"} >---
{{/tables}}