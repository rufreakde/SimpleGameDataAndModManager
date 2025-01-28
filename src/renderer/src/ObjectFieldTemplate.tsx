import Grid from '@mui/material/Grid2'
import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId
} from '@rjsf/utils'

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry
  } = props
  const uiOptions = getUiOptions<T, S, F>(uiSchema)
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>(
    'TitleFieldTemplate',
    registry,
    uiOptions
  )
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  )
  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton }
  } = registry.templates
  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid
        container
        size={{ xs: 12, xl: 12 }}
        sx={{ width: '100%', mt: 1, pl: 1, pr: 1 }}
        spacing={1}
      >
        {properties.map((element, index) => {
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          const schema = element.content && element.content.props.schema.type
          let size: any = undefined

          switch (schema) {
            case 'object':
              size = { xs: 12, xl: 12 }
              break
            case 'string':
              size = { xs: 3, xl: 3 }
              break
            case 'integer':
              size = { xs: 1, xl: 1 }
              break
            case 'boolean':
              size = { xs: 1, xl: 1 }
              break
            default:
              size = undefined
          }

          return element.hidden ? (
            element.content
          ) : (
            <Grid key={index} size={size}>
              {element.content}
            </Grid>
          )
        })}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <Grid container sx={{ width: '100%' }} justifyContent="flex-end">
            <Grid>
              <AddButton
                className="object-property-expand"
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  )
}
