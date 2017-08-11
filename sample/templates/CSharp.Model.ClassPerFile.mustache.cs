{{#tables}}
namespace Persistence.Models
{
  public class {{entity_name}}
  { {{#colunas}}       
    public {{data_type}} {{attribute_name}} { get; set; }{{/colunas}}
  }    
}
---<EOF: {"nameFile": "{{entity_name}}.cs"}>---
{{/tables}}