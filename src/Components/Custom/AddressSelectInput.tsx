import React from "react";
import {SelectInput} from "@chainsafe/common-components";
import {useField} from "formik";
import {createStyles, ITheme, makeStyles} from "@chainsafe/common-theme";

const useStyles = makeStyles(({constants}: ITheme) =>
    createStyles({
        root: {
            margin: "24px 0px"
        },
    })
);

interface IAddressSelectInput {
    addresses: [];
    name: string;
};

const AddressSelectInput: React.FC<IAddressSelectInput> =
    ({
         addresses,
         name,
     }) => {
        const classes = useStyles();
        const [field, meta, helpers] = useField(name);

        return (
            <div className={classes.root}>
                <SelectInput
                    label="Select a destination account"
                    options={addresses.map((acc, i) => ({
                        label: acc.meta.name,
                        value: i,
                    }))}
                    onChange={(index) => {
                        helpers.setValue(addresses[index].address);
                    }}
                    placeholder="Select a destination account"
                />
            </div>
        );
    };

export default AddressSelectInput;
